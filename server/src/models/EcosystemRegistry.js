const mongoose = require("mongoose");

const ecosystemRegistrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    appId: { type: String, required: true, unique: true }, // e.g., 'hrms', 'crm', 'marketplace_app_123'
    type: { type: String, enum: ["internal", "marketplace", "partner"], default: "internal" },
    description: { type: String },
    icon: { type: String }, // e.g., 'FaUsers', 'FaBriefcase'
    launchUrl: { type: String }, // The route to open when launched
    status: { type: String, enum: ["active", "maintenance", "deprecated"], default: "active" },
    capabilities: [{ type: String }], // e.g., ['context_aware', 'policy_managed']
    requiredPermissions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("EcosystemRegistry", ecosystemRegistrySchema);
