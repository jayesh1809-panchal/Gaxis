const AuditLog = require("../models/AuditLog");
const { getIpAddress, getUserAgent } = require("../middleware/auditMiddleware");
const crypto = require('crypto');

// Use lazy loading for dispatcher to avoid circular dependencies if any
let eventBusService = null;

/**
 * Core asynchronous logging method.
 * Designed as fire-and-forget; never blocks or brings down the main request.
 */
exports.logEvent = async ({
    req,
    tenantId,
    actorUserId,
    actorEmail,
    action,
    category,
    resourceType,
    resourceId,
    targetUserId,
    metadata,
    status = "success"
}) => {
    try {
        const ipAddress = req ? getIpAddress(req) : undefined;
        const userAgent = req ? getUserAgent(req) : undefined;
        const resolvedTenantId = tenantId || (req && req.tenant ? req.tenant._id : (req && req.user ? req.user.tenantId : undefined));

        // Try to pull actor details from req.user if not explicitly provided
        if (req && req.user && !actorUserId) {
            actorUserId = req.user._id || req.user.id;
        }
        if (req && req.user && !actorEmail) {
            actorEmail = req.user.email;
        }

        // Also dispatch to Event Bus Engine
        if (!eventBusService) {
            eventBusService = require('./eventBusService');
        }
        
        // Ensure tenantId exists before publishing
        if (resolvedTenantId) {
            eventBusService.publish(resolvedTenantId, 'SYSTEM', action, {
                actorUserId,
                actorEmail,
                category,
                resourceType,
                resourceId,
                targetUserId,
                metadata,
                status,
                ipAddress
            });
        }

        const logEntry = new AuditLog({
            tenantId: resolvedTenantId,
            actorUserId,
            actorEmail,
            action,
            category,
            resourceType,
            resourceId,
            targetUserId,
            metadata,
            ipAddress,
            userAgent,
            status,
            timestamp: new Date()
        });

        await logEntry.save();
    } catch (error) {
        // We log to console but intentionally do not throw.
        // Audit logging failures must not break business logic.
        console.error("CRITICAL: Failed to write to AuditLog", error);
    }
};

// --- Specialized Helper Methods ---

exports.logAuthEvent = (req, action, status = "success", metadata = {}) => {
    this.logEvent({ req, action, category: "Authentication", status, metadata });
};

exports.logMfaEvent = (req, action, status = "success", metadata = {}) => {
    this.logEvent({ req, action, category: "MFA", status, metadata });
};

exports.logSessionEvent = (req, action, resourceId, targetUserId, status = "success", metadata = {}) => {
    this.logEvent({ req, action, category: "Sessions", resourceType: "Session", resourceId, targetUserId, status, metadata });
};

exports.logRoleEvent = (req, action, resourceId, targetUserId, metadata = {}) => {
    this.logEvent({ req, action, category: "Roles", resourceType: "Role", resourceId, targetUserId, metadata });
};

exports.logPermissionEvent = (req, action, resourceId, targetUserId, metadata = {}) => {
    this.logEvent({ req, action, category: "Permissions", resourceType: "Permission", resourceId, targetUserId, metadata });
};

exports.logApplicationEvent = (req, action, resourceId, metadata = {}) => {
    this.logEvent({ req, action, category: "Applications", resourceType: "Application", resourceId, metadata });
};

exports.logSsoEvent = (req, action, resourceId, metadata = {}) => {
    this.logEvent({ req, action, category: "SSO", resourceType: "Application", resourceId, metadata });
};
