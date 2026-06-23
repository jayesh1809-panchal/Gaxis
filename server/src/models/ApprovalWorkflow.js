const mongoose = require("mongoose");

const approvalWorkflowSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Workflow name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        triggerType: {
            type: String,
            required: [true, "Trigger type is required"],
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
        steps: [
            {
                stepNumber: {
                    type: Number,
                    required: true,
                },
                approverRole: {
                    type: String,
                    required: true, // e.g. "DEPARTMENT_ADMIN", "SECURITY_ADMIN", "GLOBAL_ADMIN"
                },
                approverUserIds: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                ],
                minApprovalsRequired: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ApprovalWorkflow", approvalWorkflowSchema);
