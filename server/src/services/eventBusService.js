const crypto = require("crypto");
const EventSubscription = require("../models/EventSubscription");
const EventDelivery = require("../models/EventDelivery");
const eventDeliveryEngine = require("./eventDeliveryEngine");

class EventBusService {
    
    /**
     * Publish an event to the bus.
     * The bus will fan-out the event to all active subscribers.
     * 
     * @param {string} tenantId 
     * @param {string} source - 'SYSTEM' or 'marketplaceAppId'
     * @param {string} eventCode - e.g., 'employee.created'
     * @param {Object} payload 
     */
    async publish(tenantId, source, eventCode, payload) {
        try {
            // Internally route to Analytics Engine (Core Subscriber)
            const analyticsService = require('./analyticsService');
            analyticsService.ingestEvent(tenantId, source, eventCode, payload);

            // Internally route to Workflow Engine first (Core Subscriber)
            const workflowEventDispatcher = require('./workflowEventDispatcher');
            workflowEventDispatcher.handleEvent({
                tenantId,
                source,
                eventType: eventCode,
                payload
            });

            // Find all active subscriptions for this event code in this tenant
            const subscriptions = await EventSubscription.find({
                tenantId,
                eventCode,
                status: 'active'
            });

            if (!subscriptions || subscriptions.length === 0) {
                return; // No subscribers
            }

            const eventId = crypto.randomUUID();

            // Create Delivery records for each subscriber
            const deliveries = subscriptions.map(sub => ({
                tenantId,
                eventId,
                subscriptionId: sub._id,
                eventCode,
                payload,
                status: 'pending'
            }));

            const createdDeliveries = await EventDelivery.insertMany(deliveries);

            // Trigger the delivery engine asynchronously
            setImmediate(() => {
                for (const delivery of createdDeliveries) {
                    eventDeliveryEngine.dispatch(delivery._id);
                }
            });

        } catch (error) {
            console.error("EventBus Publish Error:", error);
        }
    }

    /**
     * Internally subscribe an application to an event
     */
    async subscribe(tenantId, applicationId, eventCode, endpoint, transport = 'webhook') {
        const sub = new EventSubscription({
            tenantId,
            applicationId,
            eventCode,
            endpoint,
            transport,
            status: 'active'
        });
        await sub.save();
        return sub;
    }

    /**
     * Unsubscribe an application from an event
     */
    async unsubscribe(tenantId, applicationId, eventCode) {
        await EventSubscription.deleteOne({
            tenantId,
            applicationId,
            eventCode
        });
    }
}

module.exports = new EventBusService();
