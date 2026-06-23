const User = require("../models/User");
const UserApplicationAccess = require("../models/UserApplicationAccess");
const ApplicationProvisioningRule = require("../models/ApplicationProvisioningRule");
const Role = require("../models/Role");
const UserRole = require("../models/UserRole");
const auditService = require("./auditService");
const auditEvents = require("../constants/auditEvents");

/**
 * Provision User Engine
 * Handles just-in-time (JIT) provisioning when a user logs into an application.
 */
exports.provisionUser = async (applicationId, userId, tenantId, req) => {
    try {
        // 1. Check if user already has access to this application
        const existingAccess = await UserApplicationAccess.findOne({
            userId,
            applicationId,
            tenantId,
        });

        // 2. Load the User profile
        const user = await User.findOne({ _id: userId, tenantId }).select("-password");
        if (!user) {
            throw new Error("User not found");
        }

        if (existingAccess) {
            // User is already provisioned. Return user.
            return {
                success: true,
                message: "User already provisioned",
                user,
            };
        }

        // 3. User is not provisioned. Load the ApplicationProvisioningRule
        const rule = await ApplicationProvisioningRule.findOne({
            applicationId,
            tenantId,
            status: "active",
        });

        if (!rule || !rule.autoCreateUser) {
            // No active rule or auto-create is disabled
            throw new Error("User is not provisioned for this application and auto-provisioning is disabled.");
        }

        // 4. Provisioning Logic: Create UserApplicationAccess
        await UserApplicationAccess.create({
            tenantId,
            userId,
            applicationId,
            assignedBy: req ? req.user?._id : null,
        });

        // 5. Default Role Assignment
        if (rule.defaultRole && rule.syncRoles) {
            // Find the role within the tenant matching the defaultRole code
            // Note: Application roles have applicationId, global roles have applicationId = null. We check for either.
            const role = await Role.findOne({
                tenantId,
                code: rule.defaultRole,
                $or: [{ applicationId: null }, { applicationId }]
            });

            if (role) {
                // Check if user already has this role (to prevent duplicates)
                const existingUserRole = await UserRole.findOne({
                    userId,
                    roleId: role._id,
                    tenantId,
                });

                if (!existingUserRole) {
                    await UserRole.create({
                        tenantId,
                        userId,
                        roleId: role._id,
                        assignedBy: req ? req.user?._id : null,
                    });
                }
            } else {
                console.warn(`[Provisioning Engine] Default role ${rule.defaultRole} not found in tenant ${tenantId}`);
                // Proceeding without throwing error. Fallback behavior: user is provisioned with no role.
            }
        }

        // 6. Log Audit Event
        if (req) {
            auditService.logEvent({
                req,
                action: auditEvents.USER_PROVISIONED || "user_provisioned",
                category: "Provisioning",
                resourceType: "User",
                resourceId: userId,
                metadata: { applicationId, ruleId: rule._id },
            });
        }

        return {
            success: true,
            message: "User successfully provisioned",
            user,
        };
    } catch (error) {
        throw new Error(`Provisioning failed: ${error.message}`);
    }
};
