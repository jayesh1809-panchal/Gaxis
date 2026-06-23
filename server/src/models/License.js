const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
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
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'suspended'],
        default: 'active',
        index: true
    },
    seats: {
        type: Number,
        default: 5
    },
    usageLimits: {
        apiCallsPerMonth: { type: Number, default: -1 },
        workflowExecutionsPerMonth: { type: Number, default: -1 },
        storageGB: { type: Number, default: -1 },
        eventsDeliveredPerMonth: { type: Number, default: -1 }
    }
}, { timestamps: true });

// A tenant can only have one license per marketplace app
licenseSchema.index({ tenantId: 1, marketplaceAppId: 1 }, { unique: true });

module.exports = mongoose.model('License', licenseSchema);
