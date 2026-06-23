const mongoose = require("mongoose");

const usageSnapshotSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true
    }, // Null for platform-wide snapshot
    snapshotDate: {
        type: Date,
        required: true,
        index: true
    },
    activeUsers: { type: Number, default: 0 },
    installedAppsCount: { type: Number, default: 0 },
    activeWorkflowsCount: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    apiCallsInPeriod: { type: Number, default: 0 },
    workflowRunsInPeriod: { type: Number, default: 0 },
    eventsPublishedInPeriod: { type: Number, default: 0 },
    eventsDeliveredInPeriod: { type: Number, default: 0 }
}, { timestamps: true });

usageSnapshotSchema.index({ tenantId: 1, snapshotDate: 1 }, { unique: true });

module.exports = mongoose.model("UsageSnapshot", usageSnapshotSchema);
