const mongoose = require('mongoose');

const usageMetricSchema = new mongoose.Schema({
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
        trim: true
    },
    value: {
        type: Number,
        required: true,
        default: 0
    },
    period: {
        type: String, // e.g., "2026-06", "all_time"
        required: true
    }
}, { timestamps: true });

// Ensure unique counter per period
usageMetricSchema.index({ tenantId: 1, marketplaceAppId: 1, metricType: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('UsageMetric', usageMetricSchema);
