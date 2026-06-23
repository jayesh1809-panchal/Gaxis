const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
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
    eventType: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        default: 'System',
        index: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false }); // We use 'timestamp' explicitly

// 90 Day TTL Index: Automatically expire raw events after 90 days.
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
