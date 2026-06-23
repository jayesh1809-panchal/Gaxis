const AnalyticsEvent = require("../models/AnalyticsEvent");
const AnalyticsAggregate = require("../models/AnalyticsAggregate");
const UsageSnapshot = require("../models/UsageSnapshot");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const MarketplaceApplication = require("../models/MarketplaceApplication");
const WorkflowDefinition = require("../models/WorkflowDefinition");

class AnalyticsAggregationEngine {

    constructor() {
        // Run aggregation every 15 minutes
        setInterval(() => this.runAggregations(), 15 * 60 * 1000);
        // For development/demo purposes, we'll run it immediately once initialized
        setTimeout(() => this.runAggregations(), 5000);
    }

    async runAggregations() {
        try {
            console.log("[Analytics] Starting periodic aggregation...");
            const tenants = await Tenant.find({}, '_id');
            const today = new Date();
            today.setUTCHours(0,0,0,0);

            // Platform-wide snapshot
            await this.generateSnapshot(null, today);

            // Per-tenant snapshot
            for (const tenant of tenants) {
                await this.generateSnapshot(tenant._id, today);
                await this.aggregateTenantMetrics(tenant._id, today);
            }
            console.log("[Analytics] Aggregation complete.");
        } catch (error) {
            console.error("Aggregation Engine Error:", error);
        }
    }

    async generateSnapshot(tenantId, snapshotDate) {
        try {
            let userCountQuery = tenantId ? { tenantId } : {};
            const activeUsers = await User.countDocuments(userCountQuery);

            let appsQuery = tenantId ? { "tenants.tenantId": tenantId } : {}; // Not perfectly accurate for platform wide but okay for MVP
            const installedAppsCount = await MarketplaceApplication.countDocuments(appsQuery);

            let workflowsQuery = tenantId ? { tenantId } : {};
            const activeWorkflowsCount = await WorkflowDefinition.countDocuments({ ...workflowsQuery, isActive: true });

            const startOfPeriod = new Date(snapshotDate);
            const endOfPeriod = new Date(startOfPeriod.getTime() + 24 * 60 * 60 * 1000);

            let eventQuery = { timestamp: { $gte: startOfPeriod, $lt: endOfPeriod } };
            if (tenantId) eventQuery.tenantId = tenantId;

            const workflowRunsInPeriod = await AnalyticsEvent.countDocuments({ ...eventQuery, eventType: 'WORKFLOW_EXECUTED' });
            const eventsPublishedInPeriod = await AnalyticsEvent.countDocuments({ ...eventQuery, eventType: 'EVENT_PUBLISHED' });
            const eventsDeliveredInPeriod = await AnalyticsEvent.countDocuments({ ...eventQuery, eventType: 'EVENT_DELIVERED' });

            await UsageSnapshot.findOneAndUpdate(
                { tenantId, snapshotDate },
                {
                    activeUsers,
                    installedAppsCount,
                    activeWorkflowsCount,
                    workflowRunsInPeriod,
                    eventsPublishedInPeriod,
                    eventsDeliveredInPeriod
                },
                { upsert: true, returnDocument: 'after' }
            );

        } catch (error) {
            console.error("Generate Snapshot Error:", error);
        }
    }

    async aggregateTenantMetrics(tenantId, targetDate) {
        // Example: Count total logins today
        const startOfPeriod = new Date(targetDate);
        const endOfPeriod = new Date(startOfPeriod.getTime() + 24 * 60 * 60 * 1000);

        const logins = await AnalyticsEvent.countDocuments({
            tenantId,
            eventType: 'USER_LOGIN',
            timestamp: { $gte: startOfPeriod, $lt: endOfPeriod }
        });

        await AnalyticsAggregate.findOneAndUpdate(
            { tenantId, metricName: 'daily_logins', timeWindow: 'daily', periodStartDate: startOfPeriod },
            { value: logins },
            { upsert: true }
        );

        // Can expand this to many other metrics easily.
    }
}

module.exports = new AnalyticsAggregationEngine();
