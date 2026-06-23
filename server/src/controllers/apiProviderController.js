const apiMarketplaceEngine = require("../services/apiMarketplaceEngine");
const APIProvider = require("../models/APIProvider");
const APIMarketplaceProduct = require("../models/APIMarketplaceProduct");

exports.registerAsProvider = async (req, res) => {
    try {
        const { organizationName, providerType } = req.body;
        const provider = await apiMarketplaceEngine.registerProvider(req.user._id, organizationName, providerType);
        res.status(201).json({ success: true, data: provider });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
};

exports.publishApi = async (req, res) => {
    try {
        const provider = await APIProvider.findOne({ userId: req.user._id });
        if (!provider) return res.status(403).json({ success: false, error: "You are not registered as a provider" });

        const { productData, plansData, monetizationData } = req.body;
        const result = await apiMarketplaceEngine.publishProduct(provider._id, productData, plansData, monetizationData);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
};

exports.getProviderDashboard = async (req, res) => {
    try {
        const provider = await APIProvider.findOne({ userId: req.user._id });
        if (!provider) return res.status(404).json({ success: false, error: "Provider not found" });

        const products = await APIMarketplaceProduct.find({ providerId: provider._id });
        
        res.status(200).json({ 
            success: true, 
            data: {
                provider,
                products
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};
