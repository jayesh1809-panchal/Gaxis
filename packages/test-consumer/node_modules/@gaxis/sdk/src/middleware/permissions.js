/**
 * Express middleware to check if the authenticated user has a specific permission.
 * Assumes req.user is populated by requireAuth middleware.
 * 
 * @param {string|string[]} requiredPermissions 
 */
function requirePermission(requiredPermissions) {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ success: false, message: "Forbidden: No permissions found" });
        }

        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        const userPermissions = req.user.permissions || [];

        const hasPermission = permissions.every(p => userPermissions.includes(p));

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
        }

        next();
    };
}

/**
 * Express middleware to check if the authenticated user has a specific role.
 * 
 * @param {string|string[]} requiredRoles 
 */
function requireRole(requiredRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ success: false, message: "Forbidden: No roles found" });
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const userRoles = req.user.roles || [];

        const hasRole = roles.some(r => userRoles.includes(r)); // User only needs one of the required roles

        if (!hasRole) {
            return res.status(403).json({ success: false, message: "Forbidden: Insufficient roles" });
        }

        next();
    };
}

module.exports = {
    requirePermission,
    requireRole
};
