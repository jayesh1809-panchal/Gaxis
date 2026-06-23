const AnalyticsEvent = require("../models/AnalyticsEvent");

class AnalyticsService {
    /**
     * Ingests an event into the analytics pipeline.
     * This method is meant to be fire-and-forget so it doesn't block core execution.
     */
    ingestEvent(tenantId, source, eventType, payload) {
        setImmediate(async () => {
            try {
                // We map known standard fields from the payload to the AnalyticsEvent model
                const actorId = payload?.actorUserId || payload?.userId || null;
                const applicationId = source === 'SYSTEM' ? null : payload?.applicationId || null;
                
                const event = new AnalyticsEvent({
                    tenantId: tenantId,
                    applicationId: applicationId,
                    eventType: eventType,
                    category: payload?.category || 'General',
                    actorId: actorId,
                    metadata: payload,
                    timestamp: new Date()
                });

                await event.save();
            } catch (error) {
                console.error("Analytics Ingestion Error:", error);
            }
        });
    }
}

module.exports = new AnalyticsService();
