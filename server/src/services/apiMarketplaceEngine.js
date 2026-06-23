const APIMarketplaceProduct = require("../models/APIMarketplaceProduct");
const APIProvider = require("../models/APIProvider");
const APIPlan = require("../models/APIPlan");
const APISubscription = require("../models/APISubscription");
const APIMonetizationRule = require("../models/APIMonetizationRule");

class APIMarketplaceEngine {
    /**
     * Register a new API Provider
     */
    async registerProvider(userId, organizationName, providerType = "external") {
        let provider = await APIProvider.findOne({ userId });
        if (!provider) {
            provider = await APIProvider.create({
                userId,
                organizationName,
                providerType,
                status: "active"
            });
        }
        return provider;
    }

    /**
     * Publish a new API to the Marketplace
     */
    async publishProduct(providerId, productData, plansData, monetizationData) {
        // 1. Create Product
        const product = await APIMarketplaceProduct.create({
            providerId,
            ...productData,
            status: "published"
        });

        // 2. Create Pricing Plans
        const plans = [];
        for (const p of plansData) {
            const plan = await APIPlan.create({
                productId: product._id,
                ...p
            });
            plans.push(plan);
        }

        // 3. Create Monetization Rule
        if (monetizationData) {
            await APIMonetizationRule.create({
                productId: product._id,
                ...monetizationData
            });
        }

        return { product, plans };
    }

    /**
     * Discover APIs by Category, Search, or Trending
     */
    async discoverProducts(filters = {}) {
        const query = { status: "published" };
        if (filters.category) query.category = filters.category;
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: "i" } },
                { description: { $regex: filters.search, $options: "i" } },
                { tags: { $in: [new RegExp(filters.search, "i")] } }
            ];
        }

        let products = APIMarketplaceProduct.find(query).populate("providerId", "organizationName");
        
        if (filters.trending) {
            products = products.sort({ subscriberCount: -1, averageRating: -1 });
        }

        return await products.exec();
    }

    /**
     * Subscribe to an API Plan
     */
    async subscribeToAPI(subscriberId, productId, planId) {
        const existing = await APISubscription.findOne({ subscriberId, productId, status: "active" });
        if (existing) {
            throw new Error("Already subscribed to this API.");
        }

        const subscription = await APISubscription.create({
            subscriberId,
            productId,
            planId,
            status: "active",
            billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });

        await APIMarketplaceProduct.findByIdAndUpdate(productId, { $inc: { subscriberCount: 1 } });

        return subscription;
    }
}

module.exports = new APIMarketplaceEngine();
