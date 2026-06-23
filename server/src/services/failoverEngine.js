const FailoverPolicy = require("../models/FailoverPolicy");
const Region = require("../models/Region");
const DeploymentCluster = require("../models/DeploymentCluster");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");

exports.evaluateFailover = async (regionId) => {
    try {
        const region = await Region.findById(regionId);
        if (!region || region.status !== "active") return;

        // Find policies where this is the primary region
        const policies = await FailoverPolicy.find({ primaryRegionId: regionId, isAutoFailoverEnabled: true });
        if (policies.length === 0) return;

        // Check cluster health in this region
        const clusters = await DeploymentCluster.find({ regionId });
        const criticalClusters = clusters.filter(c => c.healthScore < 50);

        if (criticalClusters.length > 0) {
            // Region is failing, trigger failover policies
            for (const policy of policies) {
                await this.triggerFailover(policy._id, "Automated failover due to cluster degradation");
            }
        }
    } catch (error) {
        console.error("Failover Evaluation Error:", error);
    }
};

exports.triggerFailover = async (policyId, reason, user = null) => {
    const policy = await FailoverPolicy.findById(policyId).populate("primaryRegionId secondaryRegionId");
    if (!policy) throw new Error("Policy not found");

    const primary = policy.primaryRegionId;
    const secondary = policy.secondaryRegionId;

    // Demote Primary
    primary.status = "isolated";
    primary.isPrimary = false;
    await primary.save();

    // Promote Secondary
    secondary.status = "active";
    secondary.isPrimary = true;
    await secondary.save();

    const auditLog = {
        user: user || { _id: "system", email: "system@g-axis.local" },
        tenant: { _id: "system" },
        ip: "127.0.0.1"
    };

    logEvent(auditLog, auditEvents.FAILOVER_TRIGGERED, "success", {
        policyId: policy._id,
        fromRegion: primary.code,
        toRegion: secondary.code,
        reason
    });

    return { success: true, message: `Failed over from ${primary.code} to ${secondary.code}` };
};
