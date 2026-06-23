const mongoose = require("mongoose");

const deploymentClusterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    regionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "draining", "offline", "degraded"],
        default: "active"
    },
    services: [{
        name: String,
        version: String,
        instanceCount: Number
    }],
    healthScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("DeploymentCluster", deploymentClusterSchema);
