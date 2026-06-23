const APIKey = require("../models/APIKey");
const APIRateLimit = require("../models/APIRateLimit");
const APIUsageRecord = require("../models/APIUsageRecord");
const crypto = require("crypto");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");

exports.validateApiKey = async (req, res, next) => {
    const apiKeyHeader = req.headers['x-api-key'];
    if (!apiKeyHeader) return res.status(401).json({ success: false, message: "API Key is missing" });

    try {
        const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
        const key = await APIKey.findOne({ keyHash }).populate("applicationId developerId");
        
        if (!key || key.status !== "active") {
            return res.status(401).json({ success: false, message: "Invalid or inactive API Key" });
        }

        // Record usage asynchronously
        APIUsageRecord.create({
            applicationId: key.applicationId._id,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            latencyMs: Date.now() - (req.startTime || Date.now())
        }).catch(console.error);

        // Attach identity
        req.developer = key.developerId;
        req.application = key.applicationId;
        req.apiScopes = key.scopes;

        next();
    } catch (e) {
        res.status(500).json({ success: false, message: "Gateway Error" });
    }
};

exports.generateApiKey = async (developerId, applicationId, name, scopes, user = null) => {
    const rawKey = "gk_" + crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 7) + "...";

    const key = await APIKey.create({
        name,
        keyHash,
        prefix,
        applicationId,
        developerId,
        scopes
    });

    if (user) {
        logEvent({ user, tenant: { _id: "system" }, ip: "127.0.0.1" }, auditEvents.API_KEY_CREATED, "success", { keyId: key._id, applicationId });
    }

    return { keyId: key._id, rawKey, prefix };
};
