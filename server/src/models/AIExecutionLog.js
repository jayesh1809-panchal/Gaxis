const mongoose = require("mongoose");

const aiExecutionLogSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    query: { type: String, required: true },
    actionTaken: { type: String },
    latencyMs: { type: Number },
    tokensUsed: { type: Number, default: 0 },
    outcome: { type: String, enum: ["success", "failure"], default: "success" }
}, { timestamps: true });

module.exports = mongoose.model("AIExecutionLog", aiExecutionLogSchema);
