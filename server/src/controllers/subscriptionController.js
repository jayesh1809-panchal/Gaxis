const SubscriptionPlan = require("../models/SubscriptionPlan");
const TenantSubscription = require("../models/TenantSubscription");
const UsageMetric = require("../models/UsageMetric");
const MarketplaceApplication = require("../models/MarketplaceApplication");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

/**
 * Get available plans for a marketplace application
 * GET /api/subscriptions/plans/:marketplaceAppId
 */
exports.getPlans = async (req, res) => {
    try {
        const { marketplaceAppId } = req.params;
        const plans = await SubscriptionPlan.find({ marketplaceAppId, status: 'active' }).sort({ price: 1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error("Error getting plans:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Get current subscriptions for the tenant
 * GET /api/subscriptions/my-subscriptions
 */
exports.getMySubscriptions = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const subscriptions = await TenantSubscription.find({ tenantId, status: 'active' })
            .populate('planId')
            .populate('marketplaceAppId', 'name code icon category');
        
        res.json({ success: true, data: subscriptions });
    } catch (error) {
        console.error("Error getting tenant subscriptions:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Subscribe to a plan or change plan (Upgrade/Downgrade)
 * POST /api/subscriptions/subscribe
 * Body: { marketplaceAppId, planId }
 */
exports.subscribe = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { marketplaceAppId, planId, reason } = req.body;

        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(tenantId, "SUBSCRIPTION_UPGRADE", req.user, { marketplaceAppId, planId }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                tenantId,
                req.user._id,
                "SUBSCRIPTION_UPGRADE",
                { marketplaceAppId, planId },
                reason || "Request subscription change",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Subscription change requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan || plan.marketplaceAppId.toString() !== marketplaceAppId || plan.status !== 'active') {
            return res.status(400).json({ success: false, message: "Invalid or inactive plan" });
        }

        let subscription = await TenantSubscription.findOne({ tenantId, marketplaceAppId });
        
        if (subscription) {
            // Check if it's upgrade or downgrade
            const oldPlan = await SubscriptionPlan.findById(subscription.planId);
            const isUpgrade = plan.price > (oldPlan ? oldPlan.price : 0);
            
            subscription.planId = planId;
            subscription.status = 'active';
            await subscription.save();

            // Log event
            await auditService.logEvent(
                isUpgrade ? auditEvents.PLAN_UPGRADED : auditEvents.PLAN_DOWNGRADED,
                req.user._id,
                tenantId,
                { marketplaceAppId, oldPlanId: oldPlan?._id, newPlanId: planId, isUpgrade },
                req.ip
            );
        } else {
            // New subscription
            subscription = new TenantSubscription({
                tenantId,
                marketplaceAppId,
                planId,
                status: 'active'
            });
            await subscription.save();

            // Log event
            await auditService.logEvent(
                auditEvents.PLAN_ASSIGNED,
                req.user._id,
                tenantId,
                { marketplaceAppId, planId },
                req.ip
            );
        }

        res.json({ success: true, data: subscription, message: "Subscription updated successfully" });
    } catch (error) {
        console.error("Error subscribing:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Get usage metrics for a specific app
 * GET /api/subscriptions/usage/:marketplaceAppId
 */
exports.getUsage = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { marketplaceAppId } = req.params;

        const metrics = await UsageMetric.find({ tenantId, marketplaceAppId });
        res.json({ success: true, data: metrics });
    } catch (error) {
        console.error("Error getting usage metrics:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Report usage (Backend / SDK)
 * POST /api/subscriptions/usage/report
 * Body: { marketplaceAppId, metricType, incrementValue, period }
 */
exports.reportUsage = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { marketplaceAppId, metricType, incrementValue, period } = req.body;

        const currentPeriod = period || "all_time";
        const increment = incrementValue || 1;

        const metric = await UsageMetric.findOneAndUpdate(
            { tenantId, marketplaceAppId, metricType, period: currentPeriod },
            { $inc: { value: increment } },
            { returnDocument: 'after', upsert: true }
        );

        res.json({ success: true, data: metric });
    } catch (error) {
        console.error("Error reporting usage:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Verify feature access
 * GET /api/subscriptions/verify/:marketplaceAppId?feature=some_feature
 */
exports.verifyFeature = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { marketplaceAppId } = req.params;
        const { feature } = req.query;

        const subscription = await TenantSubscription.findOne({ tenantId, marketplaceAppId, status: 'active' }).populate('planId');
        if (!subscription || !subscription.planId) {
            return res.json({ success: true, hasFeature: false, message: "No active subscription" });
        }

        const hasFeature = subscription.planId.features.includes(feature);
        res.json({ success: true, hasFeature });
    } catch (error) {
        console.error("Error verifying feature:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ============================================
// SYSTEM ADMIN ROUTES
// ============================================

exports.createPlan = async (req, res) => {
    try {
        const { marketplaceAppId, name, code, price, currency, limits, features } = req.body;
        
        const plan = new SubscriptionPlan({
            marketplaceAppId, name, code, price, currency, limits, features
        });
        
        await plan.save();

        await auditService.logEvent(
            auditEvents.PLAN_CREATED,
            req.user._id,
            req.user.tenantId, // SYSTEM tenant
            { planId: plan._id, marketplaceAppId, code },
            req.ip
        );

        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const plan = await SubscriptionPlan.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        await auditService.logEvent(
            auditEvents.PLAN_UPDATED,
            req.user._id,
            req.user.tenantId,
            { planId: plan._id, updates },
            req.ip
        );

        res.json({ success: true, data: plan });
    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
