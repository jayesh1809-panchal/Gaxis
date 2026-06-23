const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    marketplaceAppId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MarketplaceApplication',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    limits: {
        users: { type: Number, default: -1 }, // -1 for unlimited
        storageGB: { type: Number, default: -1 },
        apiCallsPerMonth: { type: Number, default: -1 }
    },
    features: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

// Ensure unique code per application
subscriptionPlanSchema.index({ marketplaceAppId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
