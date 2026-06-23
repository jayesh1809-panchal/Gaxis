const DeveloperAccount = require("../models/DeveloperAccount");
const DeveloperApplication = require("../models/DeveloperApplication");
const APIProduct = require("../models/APIProduct");
const APIKey = require("../models/APIKey");
const WebhookEndpoint = require("../models/WebhookEndpoint");
const { generateApiKey } = require("../services/apiGatewayService");
const { getAvailableSDKs } = require("../services/sdkRegistry");

exports.getDeveloperProfile = async (req, res) => {
    try {
        let profile = await DeveloperAccount.findOne({ userId: req.user._id });
        if (!profile) {
            profile = await DeveloperAccount.create({ userId: req.user._id });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const account = await DeveloperAccount.findOne({ userId: req.user._id });
        if (!account) return res.json({ success: true, data: [] });

        const apps = await DeveloperApplication.find({ developerId: account._id }).populate("apiProducts");
        res.json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createApplication = async (req, res) => {
    try {
        const { name, description, environment } = req.body;
        const account = await DeveloperAccount.findOne({ userId: req.user._id });
        if (!account) return res.status(404).json({ success: false, message: "Developer account not found" });

        const app = await DeveloperApplication.create({
            name,
            description,
            environment,
            developerId: account._id
        });

        res.status(201).json({ success: true, data: app });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApiProducts = async (req, res) => {
    try {
        const products = await APIProduct.find({ status: "active", isPublic: true });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createApiKey = async (req, res) => {
    try {
        const { applicationId, name, scopes } = req.body;
        const account = await DeveloperAccount.findOne({ userId: req.user._id });
        
        const keyData = await generateApiKey(account._id, applicationId, name, scopes, req.user);
        
        res.status(201).json({ success: true, data: keyData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApiKeys = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const keys = await APIKey.find({ applicationId }).select("-keyHash");
        res.json({ success: true, data: keys });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.registerWebhook = async (req, res) => {
    try {
        const { applicationId, url, events, secret } = req.body;
        const endpoint = await WebhookEndpoint.create({
            applicationId,
            url,
            events,
            secret
        });
        res.status(201).json({ success: true, data: endpoint });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSDKs = (req, res) => {
    res.json({ success: true, data: getAvailableSDKs() });
};
