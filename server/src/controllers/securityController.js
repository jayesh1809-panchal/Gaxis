const crypto = require("crypto");
const Application = require("../models/Application");
const ApplicationSecret = require("../models/ApplicationSecret");
const SecurityPolicy = require("../models/SecurityPolicy");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// Helper to check ownership/permissions
const checkAccess = (req, application) => {
    if (!application) return false;
    if (req.user.roleType === "SYSTEM") return true;
    if (application.ownerId?.toString() === req.user._id.toString()) return true;
    return false;
};

exports.getCredentials = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const secrets = await ApplicationSecret.find({ applicationId: application._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                clientId: application.clientId,
                clientType: application.clientType,
                status: application.status,
                secrets: secrets.map(s => ({
                    _id: s._id,
                    status: s.status,
                    createdAt: s.createdAt,
                    expiresAt: s.expiresAt,
                    // DO NOT RETURN THE HASH
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.rotateSecret = async (req, res) => {
    try {
        const { gracePeriodHours, reason } = req.body;
        const applicationId = req.params.id;

        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(req.tenant._id, "SECRET_ROTATION", req.user, { applicationId, gracePeriodHours }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                req.tenant._id,
                req.user._id,
                "SECRET_ROTATION",
                { applicationId, gracePeriodHours },
                reason || "Request secret rotation",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Secret rotation requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const application = await Application.findOne({ _id: applicationId, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // 1. Mark existing active secrets as legacy
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (gracePeriodHours || 24) * 60 * 60 * 1000);
        
        await ApplicationSecret.updateMany(
            { applicationId: application._id, status: "active" },
            { status: "legacy", expiresAt }
        );

        // 2. Generate new secret
        const newSecret = crypto.randomBytes(32).toString("hex");
        const secretHash = crypto.createHash("sha256").update(newSecret).digest("hex");

        await ApplicationSecret.create({
            tenantId: req.tenant._id,
            applicationId: application._id,
            secretHash,
            status: "active"
        });

        auditService.logSsoEvent(req, auditEvents.CLIENT_SECRET_ROTATED, application._id, { gracePeriodHours });

        // Standard OAuth2 practice: Return plaintext secret exactly once.
        res.status(200).json({
            success: true,
            data: {
                clientSecret: newSecret,
                message: "Secret rotated successfully. Please store this secret securely. It will not be shown again."
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPolicies = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        let policy = await SecurityPolicy.findOne({ applicationId: application._id });
        if (!policy) {
            policy = new SecurityPolicy({ tenantId: req.tenant._id, applicationId: application._id });
            await policy.save();
        }

        res.status(200).json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePolicies = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const {
            accessTokenTtl,
            refreshTokenTtl,
            sessionIdleTimeout,
            absoluteSessionLifetime,
            maintenanceMode,
            emergencyLockdown,
            preserveExistingSessionsOnLockdown
        } = req.body;

        let policy = await SecurityPolicy.findOne({ applicationId: application._id });
        if (!policy) {
            policy = new SecurityPolicy({ tenantId: req.tenant._id, applicationId: application._id });
        }

        if (accessTokenTtl !== undefined) policy.accessTokenTtl = accessTokenTtl;
        if (refreshTokenTtl !== undefined) policy.refreshTokenTtl = refreshTokenTtl;
        if (sessionIdleTimeout !== undefined) policy.sessionIdleTimeout = sessionIdleTimeout;
        if (absoluteSessionLifetime !== undefined) policy.absoluteSessionLifetime = absoluteSessionLifetime;
        
        // Track lockdown toggles
        const wasLocked = policy.emergencyLockdown;
        
        if (maintenanceMode !== undefined) policy.maintenanceMode = maintenanceMode;
        if (emergencyLockdown !== undefined) policy.emergencyLockdown = emergencyLockdown;
        if (preserveExistingSessionsOnLockdown !== undefined) policy.preserveExistingSessionsOnLockdown = preserveExistingSessionsOnLockdown;

        await policy.save();

        if (!wasLocked && policy.emergencyLockdown) {
            auditService.logSsoEvent(req, auditEvents.APPLICATION_LOCKED, application._id);
            if (!policy.preserveExistingSessionsOnLockdown) {
                // Burn all sessions
                await Session.updateMany({ applicationId: application._id }, { status: "revoked" });
                await RefreshToken.updateMany({ applicationId: application._id }, { revoked: true });
                auditService.logSsoEvent(req, auditEvents.SESSION_REVOKED_ALL, application._id);
            }
        } else if (wasLocked && !policy.emergencyLockdown) {
            auditService.logSsoEvent(req, auditEvents.APPLICATION_UNLOCKED, application._id);
        }

        res.status(200).json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Find active sessions
        const sessions = await Session.find({ applicationId: application._id, status: "active" })
            .populate("userId", "firstName lastName email")
            .sort({ lastActivityAt: -1 });

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.revokeSession = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        if (!checkAccess(req, application)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const session = await Session.findOne({ _id: req.params.sessionId, applicationId: application._id });
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });

        session.status = "revoked";
        await session.save();

        await RefreshToken.updateOne({ _id: session.refreshTokenId }, { revoked: true });

        auditService.logSsoEvent(req, auditEvents.SESSION_REVOKED, application._id, { targetUserId: session.userId });

        res.status(200).json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
