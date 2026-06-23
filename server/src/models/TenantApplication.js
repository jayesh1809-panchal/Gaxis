const mongoose = require("mongoose");

const tenantApplicationSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        marketplaceAppId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MarketplaceApplication",
            required: true,
            index: true,
        },
        localApplicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application", // The local OAuth client
            required: true,
        },
        installedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        installedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "uninstalled"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

tenantApplicationSchema.index({ tenantId: 1, marketplaceAppId: 1 }, { unique: true });

module.exports = mongoose.model("TenantApplication", tenantApplicationSchema);
