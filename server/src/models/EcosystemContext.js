const mongoose = require("mongoose");

const ecosystemContextSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    sessionData: {
        activeAppId: { type: String },
        activeEntityId: { type: String }, // e.g., the ID of the employee or project currently being viewed
        entityType: { type: String },
        sharedState: { type: Object } // Key-value pairs shared between apps
    },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("EcosystemContext", ecosystemContextSchema);
