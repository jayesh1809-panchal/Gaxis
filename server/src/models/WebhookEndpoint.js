const mongoose = require("mongoose");

const webhookEndpointSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperApplication",
        required: true
    },
    url: {
        type: String,
        required: true
    },
    events: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    secret: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("WebhookEndpoint", webhookEndpointSchema);
