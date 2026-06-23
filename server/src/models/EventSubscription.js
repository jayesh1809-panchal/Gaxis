const mongoose = require("mongoose");

const eventSubscriptionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MarketplaceApplication', // The subscriber
        index: true
    },
    eventCode: {
        type: String,
        required: true,
        index: true
    },
    endpoint: {
        type: String // Required if transport is webhook
    },
    transport: {
        type: String,
        enum: ['webhook', 'internal_handler'],
        default: 'webhook'
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model("EventSubscription", eventSubscriptionSchema);
