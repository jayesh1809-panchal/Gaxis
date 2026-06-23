const mongoose = require("mongoose");

const analyticsAggregateSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MarketplaceApplication',
        index: true
    },
    metricName: {
        type: String,
        required: true,
        index: true
    },
    timeWindow: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true,
        index: true
    },
    periodStartDate: {
        type: Date,
        required: true,
        index: true
    },
    value: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure uniqueness per metric per window per tenant/app
analyticsAggregateSchema.index({ 
    tenantId: 1, 
    applicationId: 1, 
    metricName: 1, 
    timeWindow: 1, 
    periodStartDate: 1 
}, { unique: true });

module.exports = mongoose.model("AnalyticsAggregate", analyticsAggregateSchema);
