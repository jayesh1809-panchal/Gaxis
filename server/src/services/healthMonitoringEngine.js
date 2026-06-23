const HealthCheck = require("../models/HealthCheck");
const DeploymentCluster = require("../models/DeploymentCluster");
const { logEvent } = require("./auditService");
const auditEvents = require("../constants/auditEvents");
const failoverEngine = require("./failoverEngine");

exports.reportHealth = async (clusterId, serviceName, metrics) => {
    try {
        let status = "healthy";
        if (metrics.errorRatePct > 5 || metrics.latencyMs > 1000) status = "degraded";
        if (metrics.errorRatePct > 50 || metrics.latencyMs > 5000) status = "down";

        const hc = await HealthCheck.create({
            clusterId,
            serviceName,
            status,
            metrics
        });

        // Update cluster overall health score simply
        const cluster = await DeploymentCluster.findById(clusterId);
        if (cluster) {
            let newScore = 100;
            if (status === "degraded") newScore = 50;
            if (status === "down") newScore = 0;
            
            if (cluster.healthScore !== newScore) {
                cluster.healthScore = newScore;
                await cluster.save();
                
                // Trigger failover evaluation
                failoverEngine.evaluateFailover(cluster.regionId).catch(console.error);
            }
        }

        return hc;
    } catch (error) {
        console.error("Health Monitoring Error:", error);
    }
};
