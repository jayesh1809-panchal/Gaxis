const mongoose = require("mongoose");

const developerApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    developerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperAccount",
        required: true
    },
    environment: {
        type: String,
        enum: ["sandbox", "production"],
        default: "sandbox"
    },
    status: {
        type: String,
        enum: ["active", "suspended", "pending_approval"],
        default: "active"
    },
    apiProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "APIProduct"
    }],
    webhookSecret: String
}, {
    timestamps: true
});

module.exports = mongoose.model("DeveloperApplication", developerApplicationSchema);
