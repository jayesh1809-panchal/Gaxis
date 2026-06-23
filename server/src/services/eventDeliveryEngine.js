const axios = require("axios");
const crypto = require("crypto");
const EventDelivery = require("../models/EventDelivery");
const EventSubscription = require("../models/EventSubscription");
const EventDeadLetter = require("../models/EventDeadLetter");

const MAX_RETRIES = 5;
const HMAC_SECRET = process.env.JWT_SECRET || "fallback_hmac_secret_key"; // In prod, ideally per-tenant or per-app secret

class EventDeliveryEngine {

    constructor() {
        // Start polling for retries every 30 seconds
        setInterval(() => this.pollRetries(), 30000);
    }

    async dispatch(deliveryId) {
        try {
            const delivery = await EventDelivery.findById(deliveryId).populate('subscriptionId');
            if (!delivery) return;

            const subscription = delivery.subscriptionId;

            delivery.status = 'retrying'; // Or running
            delivery.attempts += 1;
            delivery.lastAttemptAt = new Date();
            await delivery.save();

            const startTime = Date.now();

            try {
                if (subscription.transport === 'webhook') {
                    await this.deliverWebhook(subscription.endpoint, delivery.payload, delivery.eventCode, delivery.eventId);
                } else if (subscription.transport === 'internal_handler') {
                    await this.deliverInternal(subscription.endpoint, delivery);
                }

                delivery.status = 'delivered';
                delivery.response = {
                    statusCode: 200,
                    body: "OK",
                    durationMs: Date.now() - startTime
                };
                await delivery.save();

            } catch (error) {
                const duration = Date.now() - startTime;
                
                let statusCode = error.response ? error.response.status : 500;
                let body = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;

                delivery.response = { statusCode, body, durationMs: duration };

                if (delivery.attempts >= MAX_RETRIES) {
                    await this.failToDeadLetter(delivery, `Max retries exceeded: ${body}`);
                } else {
                    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
                    const backoffSeconds = Math.pow(2, delivery.attempts);
                    delivery.nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
                    delivery.status = 'failed';
                    await delivery.save();
                }
            }
        } catch (error) {
            console.error("Delivery Engine Error:", error);
        }
    }

    async deliverWebhook(endpoint, payload, eventCode, eventId) {
        const payloadString = JSON.stringify(payload);
        
        // Generate HMAC signature
        const signature = crypto.createHmac('sha256', HMAC_SECRET)
                                .update(payloadString)
                                .digest('hex');

        await axios({
            url: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-G-Axis-Event': eventCode,
                'X-G-Axis-Delivery': eventId,
                'X-G-Axis-Signature': `sha256=${signature}`
            },
            data: payloadString,
            timeout: 10000
        });
    }

    async deliverInternal(internalServiceKey, delivery) {
        if (internalServiceKey === 'workflow_engine') {
            const workflowEventDispatcher = require('./workflowEventDispatcher');
            // The workflow engine will handle the actual workflow definition matching
            workflowEventDispatcher.handleEvent({
                tenantId: delivery.tenantId,
                source: 'EVENT_BUS', // Abstracted
                eventType: delivery.eventCode,
                payload: delivery.payload
            });
        }
    }

    async failToDeadLetter(delivery, reason) {
        delivery.status = 'failed';
        await delivery.save();

        const dlq = new EventDeadLetter({
            tenantId: delivery.tenantId,
            deliveryId: delivery._id,
            subscriptionId: delivery.subscriptionId._id,
            eventCode: delivery.eventCode,
            failedEventPayload: delivery.payload,
            failureReason: reason,
            retryHistory: [{
                attempt: delivery.attempts,
                attemptedAt: delivery.lastAttemptAt,
                error: delivery.response?.body,
                statusCode: delivery.response?.statusCode
            }]
        });
        await dlq.save();
    }

    async pollRetries() {
        try {
            const now = new Date();
            const deliveries = await EventDelivery.find({
                status: 'failed',
                nextRetryAt: { $lte: now },
                attempts: { $lt: MAX_RETRIES }
            }).limit(50);

            for (const delivery of deliveries) {
                this.dispatch(delivery._id);
            }
        } catch (error) {
            console.error("Queue Polling Error:", error);
        }
    }

    async replay(deadLetterId) {
        const dlq = await EventDeadLetter.findById(deadLetterId).populate('deliveryId');
        if (!dlq || !dlq.deliveryId) throw new Error("DLQ Record or Delivery not found");

        const delivery = dlq.deliveryId;
        
        // Reset delivery stats
        delivery.attempts = 0;
        delivery.status = 'pending';
        delivery.nextRetryAt = null;
        await delivery.save();

        dlq.manualReplayStatus = 'pending';
        await dlq.save();

        // Dispatch
        await this.dispatch(delivery._id);

        // Check if successful now
        const updatedDelivery = await EventDelivery.findById(delivery._id);
        dlq.manualReplayStatus = updatedDelivery.status === 'delivered' ? 'success' : 'failed';
        
        // If success, we could theoretically delete the DLQ record, but we will keep it for history, marking status.
        await dlq.save();

        return updatedDelivery;
    }
}

module.exports = new EventDeliveryEngine();
