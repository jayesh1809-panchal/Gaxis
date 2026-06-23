const mongoose = require("mongoose");

const apiUsageBillingSchema = new mongoose.Schema({
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "APISubscription", required: true },
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "APIMarketplaceProduct", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "APIProvider", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalRequests: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    providerShare: { type: Number, default: 0 },
    platformShare: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "invoiced", "paid", "failed"], default: "draft" }
}, { timestamps: true });

module.exports = mongoose.model("APIUsageBilling", apiUsageBillingSchema);
