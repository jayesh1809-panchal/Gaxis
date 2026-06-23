const mongoose = require("mongoose");

const healthCheckSchema = new mongoose.Schema({
    clusterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeploymentCluster",
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["healthy", "degraded", "down"],
        required: true
    },
    metrics: {
        latencyMs: Number,
        errorRatePct: Number,
        cpuUsagePct: Number,
        memoryUsagePct: Number,
        activeConnections: Number
    }
}, {
    timestamps: true,
    timeseries: {
        timeField: 'createdAt',
        metaField: 'clusterId',
        granularity: 'seconds'
    }
});

module.exports = mongoose.model("HealthCheck", healthCheckSchema);
