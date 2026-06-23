const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @desc    Protect routes - Validate JWT and load user
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized to access this route" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

        // Load user
        const user = await User.findById(decoded.id);

        if (!user || user.status === "inactive" || user.isLocked()) {
            return res.status(401).json({ success: false, message: "User account is inactive or locked" });
        }

        // Check if user changed password after the token was issued
        if (user.passwordChangedAt) {
            const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
            if (decoded.iat < changedTimestamp) {
                return res.status(401).json({ success: false, message: "User recently changed password. Please log in again." });
            }
        }

        // Attach user, permissions, and roles to request
        req.user = user;
        req.permissions = decoded.permissions || [];
        req.roles = decoded.roles || [];
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Not authorized to access this route" });
    }
};

// @desc    Grant access to specific permissions
exports.authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        // req.permissions is loaded from the JWT payload natively!
        if (!req.permissions) {
            return res.status(403).json({ success: false, message: "User permissions not found in token" });
        }

        // Bypass for System Admins
        if (req.roles && (req.roles.includes("SYSTEM_ADMIN") || req.roles.includes("SUPER_ADMIN"))) {
            return next();
        }

        // Check if user has ANY of the required permissions
        const hasPermission = requiredPermissions.some(permission => req.permissions.includes(permission));

        if (!hasPermission) {
            console.log("Authorization failed", { requiredPermissions, userPermissions: req.permissions });
            return res.status(403).json({ success: false, message: "User is not authorized to perform this action" });
        }

        next();
    };
};

// @desc    Grant access to specific roles (optional, authorize is preferred for granular RBAC)
exports.hasRole = (...roles) => {
    return async (req, res, next) => {
        // For this we need to query user_roles since we didn't embed roles in JWT (only permissions)
        const UserRole = require("../models/UserRole");
        
        const activeRoles = await UserRole.find({ userId: req.user.id, status: "active" }).populate("roleId");
        
        const roleCodes = activeRoles.map(ur => ur.roleId.code);
        
        const hasRequiredRole = roles.some(role => roleCodes.includes(role));

        if (!hasRequiredRole) {
            return res.status(403).json({ success: false, message: `User role is not authorized to access this route` });
        }
        
        next();
    };
};
