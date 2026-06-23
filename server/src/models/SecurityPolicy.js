const mongoose = require("mongoose");

const securityPolicySchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
            unique: true,
        },
        accessTokenTtl: {
            type: Number,
            default: 3600, // 1 hour in seconds
        },
        refreshTokenTtl: {
            type: Number,
            default: 604800, // 7 days in seconds
        },
        sessionIdleTimeout: {
            type: Number,
            default: 86400, // 1 day in seconds
        },
        absoluteSessionLifetime: {
            type: Number,
            default: 2592000, // 30 days in seconds
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        emergencyLockdown: {
            type: Boolean,
            default: false,
        },
        preserveExistingSessionsOnLockdown: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("SecurityPolicy", securityPolicySchema);
