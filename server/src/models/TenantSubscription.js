const mongoose = require('mongoose');

const tenantSubscriptionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    marketplaceAppId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MarketplaceApplication',
        required: true,
        index: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'past_due', 'cancelled'],
        default: 'active'
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    usageSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// One active subscription per app per tenant
tenantSubscriptionSchema.index({ tenantId: 1, marketplaceAppId: 1 }, { unique: true });

module.exports = mongoose.model('TenantSubscription', tenantSubscriptionSchema);
