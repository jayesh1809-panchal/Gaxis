const mongoose = require("mongoose");

const failoverPolicySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    primaryRegionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true
    },
    secondaryRegionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true
    },
    triggerConditions: {
        maxLatencyMs: { type: Number, default: 500 },
        maxErrorRatePct: { type: Number, default: 5 },
        requiredConsecutiveFailures: { type: Number, default: 3 }
    },
    isAutoFailoverEnabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("FailoverPolicy", failoverPolicySchema);
