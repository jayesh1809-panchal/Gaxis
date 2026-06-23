const mongoose = require("mongoose");

const complianceRecordSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        recordType: {
            type: String,
            enum: ["audit_review", "policy_override", "control_failure", "risk_alert"],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        status: {
            type: String,
            enum: ["open", "resolved", "monitored", "approved_exception"],
            default: "open",
            index: true,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "low",
        },
        policyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GovernancePolicy",
            default: null,
        },
        relatedObjectId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        relatedObjectType: {
            type: String,
        },
        expirationDate: {
            type: Date,
            default: null, // For transient policy exceptions
        },
        reviewNotes: {
            type: String,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ComplianceRecord", complianceRecordSchema);
