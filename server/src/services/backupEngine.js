const BackupSnapshot = require("../models/BackupSnapshot");
const crypto = require("crypto");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");

exports.createBackup = async (regionId, type = "incremental", user = null) => {
    const snapshot = await BackupSnapshot.create({
        regionId,
        type,
        status: "in_progress",
        sizeBytes: Math.floor(Math.random() * 50000000) + 10000000, // Simulated size
        artifactUrl: `s3://g-axis-backups/${regionId}/${Date.now()}.gz`,
    });

    // Simulate backup process
    setTimeout(async () => {
        snapshot.status = "completed";
        snapshot.checksum = crypto.randomBytes(32).toString("hex");
        snapshot.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days retention
        await snapshot.save();

        const auditLog = {
            user: user || { _id: "system", email: "system@g-axis.local" },
            tenant: { _id: "system" },
            ip: "127.0.0.1"
        };

        logEvent(auditLog, auditEvents.BACKUP_CREATED, "success", {
            snapshotId: snapshot._id,
            regionId,
            type
        });
    }, 5000);

    return snapshot;
};
