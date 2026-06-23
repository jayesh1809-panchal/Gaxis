const Region = require("../models/Region");
const DeploymentCluster = require("../models/DeploymentCluster");
const BackupSnapshot = require("../models/BackupSnapshot");
const DisasterRecoveryPlan = require("../models/DisasterRecoveryPlan");
const HealthCheck = require("../models/HealthCheck");
const failoverEngine = require("../services/failoverEngine");
const backupEngine = require("../services/backupEngine");
const recoveryEngine = require("../services/recoveryEngine");

exports.getRegions = async (req, res) => {
    try {
        const regions = await Region.find();
        res.status(200).json({ success: true, data: regions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.createRegion = async (req, res) => {
    try {
        const region = await Region.create(req.body);
        res.status(201).json({ success: true, data: region });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getClusters = async (req, res) => {
    try {
        const clusters = await DeploymentCluster.find().populate("regionId");
        res.status(200).json({ success: true, data: clusters });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.createCluster = async (req, res) => {
    try {
        const cluster = await DeploymentCluster.create(req.body);
        res.status(201).json({ success: true, data: cluster });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.triggerFailover = async (req, res) => {
    try {
        const { policyId, reason } = req.body;
        const result = await failoverEngine.triggerFailover(policyId, reason, req.user);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.createBackup = async (req, res) => {
    try {
        const { regionId, type } = req.body;
        const result = await backupEngine.createBackup(regionId, type, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getBackups = async (req, res) => {
    try {
        const backups = await BackupSnapshot.find().populate("regionId").sort("-createdAt");
        res.status(200).json({ success: true, data: backups });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.executeDrill = async (req, res) => {
    try {
        const { planId } = req.body;
        const result = await recoveryEngine.executeDrill(planId, req.user);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
