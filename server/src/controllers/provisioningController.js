const provisioningService = require("../services/provisioningService");
const ApplicationProvisioningRule = require("../models/ApplicationProvisioningRule");
const Application = require("../models/Application");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

/**
 * Endpoint to handle Just-In-Time User Provisioning
 * POST /api/provision/user
 */
exports.provisionUser = async (req, res) => {
    try {
        const { applicationId, userId, tenantId } = req.body;

        // Security Validation: Ensure the request context matches the payload if it's coming from an authenticated user session
        // Note: For backend-to-backend API calls, we could rely on API keys or robust client-credentials auth.
        // For now, we enforce tenant isolation by strictly using the req.tenant._id from the token
        const effectiveTenantId = req.tenant ? req.tenant._id : tenantId;

        if (!applicationId || !userId) {
            return res.status(400).json({ success: false, message: "applicationId and userId are required." });
        }

        const result = await provisioningService.provisionUser(applicationId, userId, effectiveTenantId, req);

        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes("is not provisioned")) {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Provisioning Rule for an Application
 * GET /api/provision/rules/:applicationId
 */
exports.getProvisioningRule = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const rule = await ApplicationProvisioningRule.findOne({
            applicationId,
            tenantId: req.tenant._id,
        });

        // Even if not found, we return a success with null data to signify it hasn't been set yet
        res.status(200).json({
            success: true,
            data: rule || {
                autoCreateUser: false,
                syncProfile: true,
                syncRoles: true,
                defaultRole: "EMPLOYEE",
                status: "active"
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create or Update Provisioning Rule
 * PUT /api/provision/rules/:applicationId
 */
exports.upsertProvisioningRule = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const updateData = req.body;

        // Ensure application exists and belongs to tenant
        const application = await Application.findOne({
            _id: applicationId,
            tenantId: req.tenant._id,
        });

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const rule = await ApplicationProvisioningRule.findOneAndUpdate(
            { applicationId, tenantId: req.tenant._id },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_UPDATED || "application_updated",
            category: "Provisioning",
            resourceType: "ApplicationProvisioningRule",
            resourceId: rule._id,
            metadata: { applicationId, action: "upsert_rule" }
        });

        res.status(200).json({
            success: true,
            message: "Provisioning rule updated successfully",
            data: rule,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
