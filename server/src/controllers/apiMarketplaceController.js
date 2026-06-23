const apiMarketplaceEngine = require("../services/apiMarketplaceEngine");
const APIMarketplaceProduct = require("../models/APIMarketplaceProduct");
const APIPlan = require("../models/APIPlan");
const APISubscription = require("../models/APISubscription");

exports.discoverProducts = async (req, res) => {
    try {
        const products = await apiMarketplaceEngine.discoverProducts(req.query);
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getProductDetails = async (req, res) => {
    try {
        const product = await APIMarketplaceProduct.findById(req.params.id).populate("providerId", "organizationName website");
        if (!product) return res.status(404).json({ success: false, error: "Product not found" });

        const plans = await APIPlan.find({ productId: product._id });
        
        res.status(200).json({ success: true, data: { product, plans } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        const { productId, planId } = req.body;
        const subscription = await apiMarketplaceEngine.subscribeToAPI(req.user._id, productId, planId);
        res.status(201).json({ success: true, data: subscription });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
};

exports.getMySubscriptions = async (req, res) => {
    try {
        const subscriptions = await APISubscription.find({ subscriberId: req.user._id })
            .populate("productId", "name category")
            .populate("planId", "name type price");
        res.status(200).json({ success: true, count: subscriptions.length, data: subscriptions });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};
