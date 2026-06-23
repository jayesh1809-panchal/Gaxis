const APISubscription = require("../models/APISubscription");
const APIMonetizationRule = require("../models/APIMonetizationRule");
const APIUsageBilling = require("../models/APIUsageBilling");
const APIMarketplaceProduct = require("../models/APIMarketplaceProduct");
const APIProvider = require("../models/APIProvider");

class APIMonetizationEngine {
    /**
     * Record Usage Event (Called by API Gateway / Proxy)
     */
    async recordUsageEvent(subscriberId, productId, increment = 1) {
        // Update subscription current usage count
        const subscription = await APISubscription.findOneAndUpdate(
            { subscriberId, productId, status: "active" },
            { $inc: { "currentUsage.requestsThisCycle": increment } },
            { new: true }
        );

        if (!subscription) {
            throw new Error("No active subscription found for this API.");
        }

        return subscription;
    }

    /**
     * Generate Monthly Ledger / Invoice for a Subscription
     */
    async generateBillingLedger(subscriptionId) {
        const subscription = await APISubscription.findById(subscriptionId).populate("planId");
        if (!subscription) throw new Error("Subscription not found");

        const rule = await APIMonetizationRule.findOne({ productId: subscription.productId });
        const product = await APIMarketplaceProduct.findById(subscription.productId);

        const totalRequests = subscription.currentUsage.requestsThisCycle;
        let amountDue = 0;

        // Fixed pricing
        if (subscription.planId.type === "monthly" || subscription.planId.type === "annual") {
            amountDue += subscription.planId.price;
        }
        
        // Usage based pricing
        if (subscription.planId.type === "usage_based" || (rule && rule.perRequestRate > 0)) {
            amountDue += totalRequests * (rule?.perRequestRate || 0);
        }

        // Revenue split
        let providerShare = 0;
        let platformShare = 0;
        if (rule && amountDue > 0) {
            providerShare = amountDue * (rule.revenueSharePercentage.provider / 100);
            platformShare = amountDue * (rule.revenueSharePercentage.platform / 100);
        }

        // Create Ledger
        const ledger = await APIUsageBilling.create({
            subscriptionId: subscription._id,
            subscriberId: subscription.subscriberId,
            productId: product._id,
            providerId: product.providerId,
            periodStart: subscription.billingCycleStart,
            periodEnd: new Date(),
            totalRequests,
            amountDue,
            providerShare,
            platformShare,
            status: "invoiced"
        });

        // Aggregate revenue to provider
        await APIProvider.findByIdAndUpdate(product.providerId, { $inc: { totalRevenue: providerShare } });

        // Reset usage for next cycle
        subscription.currentUsage.requestsThisCycle = 0;
        subscription.billingCycleStart = new Date();
        subscription.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();

        return ledger;
    }
}

module.exports = new APIMonetizationEngine();
