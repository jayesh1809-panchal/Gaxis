const mongoose = require("mongoose");

const governancePolicySchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Policy name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Policy code is required"],
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                "APPLICATION_INSTALLATION",
                "APPLICATION_REMOVAL",
                "ROLE_ASSIGNMENT",
                "PERMISSION_ESCALATION",
                "WORKFLOW_PUBLISHING",
                "SECRET_ROTATION",
                "MARKETPLACE_PUBLISHING",
                "SUBSCRIPTION_UPGRADE",
            ],
        },
        approvalWorkflowId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApprovalWorkflow",
            default: null,
        },
        enforcementRules: {
            allowedIPs: [
                {
                    type: String,
                },
            ],
            allowedTimeWindows: [
                {
                    startHour: Number, // 0-23
                    endHour: Number, // 0-23
                },
            ],
            requireMfa: {
                type: Boolean,
                default: false,
            },
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

governancePolicySchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("GovernancePolicy", governancePolicySchema);
