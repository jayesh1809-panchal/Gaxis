const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        actorUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        actorEmail: {
            type: String, // Stored even if user is deleted
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            index: true,
        },
        resourceType: {
            type: String,
            index: true,
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // flexible JSON for diffs, etc.
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        status: {
            type: String,
            enum: ["success", "failure"],
            default: "success",
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false, // Using explicit 'timestamp'
    }
);

// Compound Index for quick "User History" sorted by time
auditLogSchema.index({ actorUserId: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
