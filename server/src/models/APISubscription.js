const mongoose = require("mongoose");

const apiSubscriptionSchema = new mongoose.Schema({
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Tenant or individual Dev
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "APIPlan", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "APIMarketplaceProduct", required: true },
    status: { type: String, enum: ["active", "canceled", "past_due"], default: "active" },
    currentUsage: {
        requestsThisCycle: { type: Number, default: 0 }
    },
    billingCycleStart: { type: Date, default: Date.now },
    billingCycleEnd: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("APISubscription", apiSubscriptionSchema);
