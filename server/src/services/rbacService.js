const User = require("../models/User");
const UserRole = require("../models/UserRole");
const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");
const Permission = require("../models/Permission");

/**
 * Resolves all active roles assigned to a user.
 * @param {String} userId - The user's ID
 * @returns {Array} List of populated role objects
 */
exports.resolveUserRoles = async (userId) => {
    // 1. Verify User exists
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // 2. Fetch active User-Role assignments
    const userRoles = await UserRole.find({ userId, status: "active" })
        .populate({
            path: "roleId",
            match: { status: "active" } // Only get active roles
        });

    // Filter out nulls (in case a role was deleted or made inactive)
    const activeRoles = userRoles
        .filter(ur => ur.roleId)
        .map(ur => ur.roleId);

    return activeRoles;
};

/**
 * Resolves all effective permissions for a user by aggregating permissions from all active roles.
 * @param {String} userId - The user's ID
 * @returns {Object} { roles: [], permissions: [] } containing fully resolved string codes
 */
exports.resolveUserPermissions = async (userId) => {
    // 1. Get resolved active roles
    const roles = await this.resolveUserRoles(userId);
    
    if (roles.length === 0) {
        return { roles: [], permissions: [] };
    }

    const roleIds = roles.map(r => r._id);
    const roleCodes = roles.map(r => r.code);

    // 2. Fetch all permissions mapped to those roles
    const rolePermissions = await RolePermission.find({
        roleId: { $in: roleIds },
        status: "active"
    }).populate({
        path: "permissionId",
        match: { status: "active" } // Only get active permissions
    });

    // 3. Extract and Deduplicate Permission Codes
    const permissionSet = new Set();
    
    rolePermissions.forEach(rp => {
        if (rp.permissionId) {
            permissionSet.add(rp.permissionId.code);
        }
    });

    return {
        roles: roleCodes,
        permissions: Array.from(permissionSet).sort() // Alphabetize for clean output
    };
};
