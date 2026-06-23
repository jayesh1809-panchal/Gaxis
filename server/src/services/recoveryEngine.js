const DisasterRecoveryPlan = require("../models/DisasterRecoveryPlan");
const BackupSnapshot = require("../models/BackupSnapshot");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");

exports.executeDrill = async (planId, user = null) => {
    const plan = await DisasterRecoveryPlan.findById(planId);
    if (!plan) throw new Error("DR Plan not found");

    const auditLog = {
        user: user || { _id: "system", email: "system@g-axis.local" },
        tenant: { _id: "system" },
        ip: "127.0.0.1"
    };

    logEvent(auditLog, auditEvents.RECOVERY_DRILL_STARTED, "success", { planId });

    // Simulate execution of runbook steps
    setTimeout(async () => {
        plan.lastDrillAt = new Date();
        plan.lastDrillStatus = "success";
        await plan.save();

        logEvent(auditLog, auditEvents.RECOVERY_COMPLETED, "success", { planId });
    }, 8000);

    return { success: true, message: "Drill started asynchronously" };
};

exports.restoreSnapshot = async (snapshotId, user = null) => {
    const snapshot = await BackupSnapshot.findById(snapshotId);
    if (!snapshot) throw new Error("Snapshot not found");

    const auditLog = {
        user: user || { _id: "system", email: "system@g-axis.local" },
        tenant: { _id: "system" },
        ip: "127.0.0.1"
    };

    // Simulate restore
    setTimeout(() => {
        logEvent(auditLog, auditEvents.BACKUP_RESTORED, "success", { snapshotId });
    }, 6000);

    return { success: true, message: "Restore initiated" };
};
