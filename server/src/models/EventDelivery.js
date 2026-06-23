const mongoose = require("mongoose");

const eventDeliverySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    eventId: {
        type: String, // Unique ID for the published event payload instance
        required: true,
        index: true
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventSubscription',
        required: true
    },
    eventCode: {
        type: String,
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'failed', 'retrying'],
        default: 'pending',
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastAttemptAt: { type: Date },
    nextRetryAt: { type: Date }, // Indexed for queue polling
    response: {
        statusCode: Number,
        body: String,
        durationMs: Number
    }
}, { timestamps: true });

eventDeliverySchema.index({ status: 1, nextRetryAt: 1 }); // For polling

module.exports = mongoose.model("EventDelivery", eventDeliverySchema);
