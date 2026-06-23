const License = require('../models/License');
const TenantSubscription = require('../models/TenantSubscription');
const User = require('../models/User');
const UsageMetric = require('../models/UsageMetric');

/**
 * Check if the tenant holds a valid, non-expired license for the application
 */
async function hasValidLicense(tenantId, marketplaceAppId) {
    try {
        const license = await License.findOne({
            tenantId,
            marketplaceAppId,
            status: 'active',
            expiryDate: { $gt: new Date() }
        });
        return !!license;
    } catch (error) {
        console.error("Error in hasValidLicense check:", error);
        return false;
    }
}

/**
 * Check if the plan is active for the subscription
 */
async function isPlanActive(tenantId, marketplaceAppId) {
    try {
        const subscription = await TenantSubscription.findOne({
            tenantId,
            marketplaceAppId,
            status: 'active'
        });
        if (!subscription) return false;
        
        if (subscription.expiresAt && subscription.expiresAt < new Date()) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error in isPlanActive check:", error);
        return false;
    }
}

/**
 * Check if the tenant has capacity for additional resources (e.g. seats)
 */
async function hasCapacity(tenantId, marketplaceAppId, capacityType, requiredQuantity = 1) {
    try {
        const license = await License.findOne({ tenantId, marketplaceAppId });
        if (!license) return false;

        if (license.status !== 'active' || license.expiryDate < new Date()) {
            return false;
        }

        if (capacityType === 'seats') {
            const limit = license.seats;
            if (limit === -1) return true; // Unlimited

            // Count current active users in tenant
            const currentUsersCount = await User.countDocuments({ tenantId, status: 'active' });
            return (currentUsersCount + requiredQuantity) <= limit;
        }

        return true;
    } catch (error) {
        console.error("Error in hasCapacity check:", error);
        return false;
    }
}

/**
 * Check if the tenant has remaining monthly quota for metered usage metrics
 */
async function hasRemainingUsage(tenantId, marketplaceAppId, metricType, quantity = 1) {
    try {
        const license = await License.findOne({ tenantId, marketplaceAppId });
        if (!license) return false;

        if (license.status !== 'active' || license.expiryDate < new Date()) {
            return false;
        }

        // Map metric types to license limit keys
        let limitKey = '';
        if (['api_calls', 'apiCallsPerMonth'].includes(metricType)) {
            limitKey = 'apiCallsPerMonth';
        } else if (['workflow_executions', 'workflowExecutionsPerMonth'].includes(metricType)) {
            limitKey = 'workflowExecutionsPerMonth';
        } else if (['storage', 'storageGB'].includes(metricType)) {
            limitKey = 'storageGB';
        } else if (['event_deliveries', 'eventsDeliveredPerMonth'].includes(metricType)) {
            limitKey = 'eventsDeliveredPerMonth';
        } else {
            return true; // Unknown/custom metrics default to allowed or unlimited
        }

        const limit = license.usageLimits[limitKey];
        if (limit === -1 || limit === undefined) return true; // Unlimited

        // Get current period (YYYY-MM)
        const date = new Date();
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const metric = await UsageMetric.findOne({
            tenantId,
            marketplaceAppId,
            metricType,
            period
        });

        const currentUsage = metric ? metric.value : 0;
        return (currentUsage + quantity) <= limit;
    } catch (error) {
        console.error("Error in hasRemainingUsage check:", error);
        return false;
    }
}

module.exports = {
    hasValidLicense,
    isPlanActive,
    hasCapacity,
    hasRemainingUsage
};
