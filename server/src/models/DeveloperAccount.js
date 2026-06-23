const mongoose = require("mongoose");

const developerAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "suspended", "pending"],
        default: "active"
    },
    tier: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free"
    },
    apiAccessEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("DeveloperAccount", developerAccountSchema);
