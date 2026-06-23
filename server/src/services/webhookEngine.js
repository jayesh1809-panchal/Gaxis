const WebhookEndpoint = require("../models/WebhookEndpoint");
const crypto = require("crypto");
const axios = require("axios");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");

exports.dispatchWebhook = async (event, payload) => {
    try {
        const endpoints = await WebhookEndpoint.find({ events: event, isActive: true });
        
        for (const endpoint of endpoints) {
            // Sign payload
            const signature = crypto.createHmac('sha256', endpoint.secret).update(JSON.stringify(payload)).digest('hex');
            
            // Dispatch asynchronously (simulate retry logic)
            axios.post(endpoint.url, payload, {
                headers: {
                    'X-G-Axis-Signature': signature,
                    'X-G-Axis-Event': event
                },
                timeout: 5000
            }).then(() => {
                logEvent({ user: { _id: "system", email: "system" }, tenant: { _id: "system" }, ip: "system" }, 
                         auditEvents.WEBHOOK_DELIVERED, "success", { endpointId: endpoint._id, event });
            }).catch(e => {
                console.error("Webhook delivery failed for", endpoint.url, e.message);
            });
        }
    } catch (e) {
        console.error("Webhook engine error:", e);
    }
};
