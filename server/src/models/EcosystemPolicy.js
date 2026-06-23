const mongoose = require("mongoose");

const ecosystemPolicySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    targetApps: [{ type: mongoose.Schema.Types.ObjectId, ref: "EcosystemRegistry" }],
    type: { type: String, enum: ["cross_app_access", "data_sharing", "launch_restriction"], required: true },
    conditions: { type: Object }, // JSON object defining policy constraints
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    priority: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("EcosystemPolicy", ecosystemPolicySchema);
