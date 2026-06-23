const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    keyHash: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperApplication",
        required: true
    },
    developerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperAccount",
        required: true
    },
    scopes: [{
        type: String
    }],
    status: {
        type: String,
        enum: ["active", "revoked", "expired"],
        default: "active"
    },
    expiresAt: Date,
    lastUsedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model("APIKey", apiKeySchema);
