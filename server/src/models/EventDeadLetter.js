const mongoose = require("mongoose");

const eventDeadLetterSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    deliveryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventDelivery',
        required: true,
        unique: true
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
    failedEventPayload: {
        type: mongoose.Schema.Types.Mixed
    },
    failureReason: {
        type: String
    },
    retryHistory: [{
        attempt: Number,
        attemptedAt: Date,
        error: String,
        statusCode: Number
    }],
    manualReplayStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model("EventDeadLetter", eventDeadLetterSchema);
