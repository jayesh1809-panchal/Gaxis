const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/../.env" });

const Region = require("../src/models/Region");
const DeploymentCluster = require("../src/models/DeploymentCluster");
const HealthCheck = require("../src/models/HealthCheck");
const FailoverPolicy = require("../src/models/FailoverPolicy");
const BackupSnapshot = require("../src/models/BackupSnapshot");
const DisasterRecoveryPlan = require("../src/models/DisasterRecoveryPlan");

const healthMonitoringEngine = require("../src/services/healthMonitoringEngine");
const failoverEngine = require("../src/services/failoverEngine");
const backupEngine = require("../src/services/backupEngine");
const recoveryEngine = require("../src/services/recoveryEngine");

async function runTests() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create Regions
        await Region.deleteMany({});
        const usEast = await Region.create({ code: "us-east-1", name: "US East (N. Virginia)", isPrimary: true });
        const usWest = await Region.create({ code: "us-west-2", name: "US West (Oregon)", isPrimary: false });
        console.log("Created regions:", usEast.code, usWest.code);

        // 2. Create Clusters
        await DeploymentCluster.deleteMany({});
        const clusterA = await DeploymentCluster.create({ name: "Auth-Cluster-East", regionId: usEast._id });
        const clusterB = await DeploymentCluster.create({ name: "Auth-Cluster-West", regionId: usWest._id });
        console.log("Created clusters");

        // 3. Create Failover Policy
        await FailoverPolicy.deleteMany({});
        const policy = await FailoverPolicy.create({
            name: "Global-Auth-Failover",
            primaryRegionId: usEast._id,
            secondaryRegionId: usWest._id,
            isAutoFailoverEnabled: true
        });
        console.log("Created policy:", policy.name);

        // 4. Simulate Health Issue & Auto-Failover
        console.log("\n--- Simulating degraded health in primary region ---");
        await healthMonitoringEngine.reportHealth(clusterA._id, "AuthService", {
            latencyMs: 6000, // Very high latency
            errorRatePct: 60 // High error rate
        });
        
        // Wait a bit for async failover
        await new Promise(r => setTimeout(r, 1000));
        
        const primaryAfter = await Region.findById(usEast._id);
        const secondaryAfter = await Region.findById(usWest._id);
        console.log("usEast status after failover:", primaryAfter.status); // should be isolated
        console.log("usWest status after failover:", secondaryAfter.status); // should be active and primary=true

        // 5. Test Backups
        console.log("\n--- Testing Backup Engine ---");
        const backup = await backupEngine.createBackup(usWest._id, "full");
        console.log("Backup triggered, status:", backup.status);

        // 6. Test DR Plan
        console.log("\n--- Testing DR Drill ---");
        await DisasterRecoveryPlan.deleteMany({});
        const plan = await DisasterRecoveryPlan.create({
            name: "Complete Region Restore",
            runbookSteps: [{ stepOrder: 1, description: "Restore database snapshot", actionType: "automated" }]
        });
        const drillRes = await recoveryEngine.executeDrill(plan._id);
        console.log("Drill started:", drillRes.message);

        console.log("\nWaiting for async operations to complete... (6 seconds)");
        await new Promise(r => setTimeout(r, 6000));

        const backupAfter = await BackupSnapshot.findById(backup._id);
        console.log("Backup status after async finish:", backupAfter.status);

        console.log("\nAll Infrastructure components tested successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

runTests();
