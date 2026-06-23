const mongoose = require('mongoose');

const usageChargeSchema = new mongoose.Schema({
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
    metricType: {
        type: String,
        required: true,
        enum: ['api_calls', 'workflow_executions', 'storage', 'event_deliveries', 'marketplace_consumption']
    },
    quantity: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    billingPeriod: {
        type: String, // e.g. "2026-06"
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'invoiced'],
        default: 'pending',
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('UsageCharge', usageChargeSchema);
