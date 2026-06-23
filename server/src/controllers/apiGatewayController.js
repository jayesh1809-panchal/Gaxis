const APIUsageRecord = require("../models/APIUsageRecord");
const { dispatchWebhook } = require("../services/webhookEngine");

exports.healthCheck = (req, res) => {
    res.json({
        success: true,
        message: "API Gateway is active",
        developer: req.developer ? req.developer._id : null,
        application: req.application ? req.application.name : null,
        scopes: req.apiScopes || []
    });
};

exports.getUsageAnalytics = async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        // Aggregating timeseries data by status code
        const usage = await APIUsageRecord.aggregate([
            { $match: { applicationId: require('mongoose').Types.ObjectId(applicationId) } },
            {
                $group: {
                    _id: "$statusCode",
                    count: { $sum: 1 },
                    avgLatency: { $avg: "$latencyMs" }
                }
            }
        ]);

        res.json({ success: true, data: usage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.simulateWebhookEvent = async (req, res) => {
    try {
        const { event, payload } = req.body;
        await dispatchWebhook(event, payload);
        res.json({ success: true, message: "Webhook dispatched successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
