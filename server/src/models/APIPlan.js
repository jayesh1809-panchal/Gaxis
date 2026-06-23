const mongoose = require("mongoose");

const apiPlanSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "APIMarketplaceProduct", required: true },
    name: { type: String, required: true }, // Free, Pro, Enterprise
    type: { type: String, enum: ["free", "monthly", "annual", "usage_based"], required: true },
    price: { type: Number, required: true }, // 0 for free or usage_based
    quotaLimits: {
        requestsPerMonth: { type: Number, default: null } // null = unlimited
    },
    rateLimits: {
        requestsPerSecond: { type: Number, default: 10 }
    }
}, { timestamps: true });

module.exports = mongoose.model("APIPlan", apiPlanSchema);
