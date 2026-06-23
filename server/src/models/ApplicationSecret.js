const mongoose = require("mongoose");

const applicationSecretSchema = new mongoose.Schema(
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
        },
        secretHash: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "legacy", "revoked"],
            default: "active",
            index: true,
        },
        expiresAt: {
            type: Date, // For legacy secrets
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

applicationSecretSchema.index({ applicationId: 1, status: 1 });

module.exports = mongoose.model("ApplicationSecret", applicationSecretSchema);
