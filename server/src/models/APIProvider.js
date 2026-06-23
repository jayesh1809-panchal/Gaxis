const mongoose = require("mongoose");

const apiProviderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The user representing the provider
    organizationName: { type: String, required: true },
    providerType: { type: String, enum: ["internal", "external", "partner"], default: "external" },
    status: { type: String, enum: ["pending_approval", "active", "suspended"], default: "active" },
    supportEmail: { type: String },
    website: { type: String },
    totalRevenue: { type: Number, default: 0 } // Aggregated total revenue earned
}, { timestamps: true });

module.exports = mongoose.model("APIProvider", apiProviderSchema);
