const License = require('../models/License');
const licensingEngine = require('../services/licensingEngine');
const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * Get active licenses for tenant
 * GET /api/licensing/my-licenses
 */
exports.getMyLicenses = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const licenses = await License.find({ tenantId })
            .populate('marketplaceAppId', 'name code icon')
            .populate('planId', 'name code price currency');
        
        res.json({ success: true, data: licenses });
    } catch (error) {
        console.error("Error getting active licenses:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Verify license and capabilities
 * GET /api/licensing/verify/:marketplaceAppId
 * Query params:
 *   - feature: Check feature entitlement flag
 *   - capacityType: Check seat limit (e.g. capacityType=seats)
 *   - metricType: Check monthly quota allowance (e.g. metricType=api_calls)
 *   - quantity: Specify increment check (default is 1)
 */
exports.verifyLicense = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { marketplaceAppId } = req.params;
        const { feature, capacityType, metricType, quantity } = req.query;

        const increment = parseInt(quantity || '1', 10);

        // 1. Basic License check
        const hasLicense = await licensingEngine.hasValidLicense(tenantId, marketplaceAppId);
        if (!hasLicense) {
            return res.json({
                success: true,
                allowed: false,
                reason: "No active or valid license found for this application."
            });
        }

        // 2. Feature Check
        if (feature) {
            const license = await License.findOne({ tenantId, marketplaceAppId }).populate('planId');
            const allowed = license && license.planId && license.planId.features.includes(feature);
            return res.json({
                success: true,
                allowed: !!allowed,
                reason: allowed ? "Feature is supported by current plan." : "Feature is not supported under this plan."
            });
        }

        // 3. Capacity Check (e.g., Seats check)
        if (capacityType) {
            const allowed = await licensingEngine.hasCapacity(tenantId, marketplaceAppId, capacityType, increment);
            return res.json({
                success: true,
                allowed,
                reason: allowed ? "Capacity limit check passed." : `Capacity limit exceeded for type: ${capacityType}.`
            });
        }

        // 4. Metric Usage check
        if (metricType) {
            const allowed = await licensingEngine.hasRemainingUsage(tenantId, marketplaceAppId, metricType, increment);
            return res.json({
                success: true,
                allowed,
                reason: allowed ? "Metered quota remaining." : `Metered quota exceeded for type: ${metricType}.`
            });
        }

        // If no spec, just return that license is valid
        res.json({
            success: true,
            allowed: true,
            reason: "Application license is active and valid."
        });
    } catch (error) {
        console.error("Error verifying license:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
