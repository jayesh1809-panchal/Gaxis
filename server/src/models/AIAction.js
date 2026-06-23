const mongoose = require("mongoose");

const aiActionSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actionType: { type: String, required: true }, // e.g. "CREATE_WORKFLOW_DRAFT", "GENERATE_POLICY", "RECOMMEND_UPGRADE"
    description: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["drafted", "pending_approval", "approved", "rejected", "executed", "failed"], default: "drafted", index: true },
    approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    executionResult: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model("AIAction", aiActionSchema);
