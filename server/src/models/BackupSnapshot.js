const mongoose = require("mongoose");

const backupSnapshotSchema = new mongoose.Schema({
    regionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true
    },
    type: {
        type: String,
        enum: ["full", "incremental"],
        required: true
    },
    status: {
        type: String,
        enum: ["in_progress", "completed", "failed", "verified"],
        default: "in_progress"
    },
    sizeBytes: {
        type: Number,
        default: 0
    },
    artifactUrl: {
        type: String
    },
    checksum: {
        type: String
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("BackupSnapshot", backupSnapshotSchema);
