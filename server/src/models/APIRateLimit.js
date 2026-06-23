const mongoose = require("mongoose");

const apiRateLimitSchema = new mongoose.Schema({
    entityType: {
        type: String,
        enum: ["user", "application", "tenant"],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    limitType: {
        type: String,
        enum: ["requests_per_second", "requests_per_day", "burst"],
        required: true
    },
    limitValue: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("APIRateLimit", apiRateLimitSchema);
