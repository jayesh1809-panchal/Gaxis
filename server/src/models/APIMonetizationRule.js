const mongoose = require("mongoose");

const apiMonetizationRuleSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "APIMarketplaceProduct", required: true },
    perRequestRate: { type: Number, default: 0 }, // $0.001 per request
    revenueSharePercentage: {
        provider: { type: Number, default: 80 }, // 80% to provider
        platform: { type: Number, default: 20 }  // 20% to G-Axis
    }
}, { timestamps: true });

module.exports = mongoose.model("APIMonetizationRule", apiMonetizationRuleSchema);
