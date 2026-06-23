const mongoose = require("mongoose");

const disasterRecoveryPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    targetRpoMinutes: {
        type: Number,
        default: 15
    },
    targetRtoMinutes: {
        type: Number,
        default: 60
    },
    runbookSteps: [{
        stepOrder: Number,
        description: String,
        actionType: {
            type: String,
            enum: ["manual", "automated"]
        },
        scriptPath: String
    }],
    lastDrillAt: {
        type: Date
    },
    lastDrillStatus: {
        type: String,
        enum: ["success", "failure", "partial_success"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("DisasterRecoveryPlan", disasterRecoveryPlanSchema);
