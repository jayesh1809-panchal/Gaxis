const mongoose = require("mongoose");

const aiKnowledgeSourceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    sourceType: { type: String, enum: ["event_bus", "analytics", "governance", "marketplace", "custom"], required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastIndexedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("AIKnowledgeSource", aiKnowledgeSourceSchema);
