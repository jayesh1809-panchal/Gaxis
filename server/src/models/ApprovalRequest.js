const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        requestType: {
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
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "failed", "completed"],
            default: "pending",
            index: true,
        },
        reason: {
            type: String,
            required: [true, "Reason for request is required"],
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true, // The details of the action to execute once approved
        },
        workflowId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApprovalWorkflow",
            required: true,
        },
        currentStep: {
            type: Number,
            default: 1,
        },
        approvalsReceived: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                stepNumber: {
                    type: Number,
                },
                decision: {
                    type: String,
                    enum: ["approved", "rejected"],
                },
                comments: {
                    type: String,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        decisionNotes: {
            type: String,
        },
        changeTrack: {
            beforeValue: {
                type: mongoose.Schema.Types.Mixed,
            },
            afterValue: {
                type: mongoose.Schema.Types.Mixed,
            },
            relatedObjectId: {
                type: mongoose.Schema.Types.ObjectId,
            },
            relatedObjectType: {
                type: String,
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
