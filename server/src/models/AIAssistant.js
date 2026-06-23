const mongoose = require("mongoose");

const aiAssistantSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    systemPrompt: { type: String, required: true },
    temperature: { type: Number, default: 0.7 },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("AIAssistant", aiAssistantSchema);
