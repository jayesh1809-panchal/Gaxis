const GovernancePolicy = require("../models/GovernancePolicy");
const ApprovalWorkflow = require("../models/ApprovalWorkflow");
const ApprovalRequest = require("../models/ApprovalRequest");
const ComplianceRecord = require("../models/ComplianceRecord");
const TenantApplication = require("../models/TenantApplication");
const Application = require("../models/Application");
const ApplicationSecret = require("../models/ApplicationSecret");
const SecurityPolicy = require("../models/SecurityPolicy");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const UserRole = require("../models/UserRole");
const RolePermission = require("../models/RolePermission");
const TenantSubscription = require("../models/TenantSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const MarketplaceApplication = require("../models/MarketplaceApplication");
const ApplicationPackage = require("../models/ApplicationPackage");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const ApplicationProvisioningRule = require("../models/ApplicationProvisioningRule");
const WorkflowDefinition = require("../models/WorkflowDefinition");
const User = require("../models/User");
const MfaSettings = require("../models/MfaSettings");
const auditService = require("./auditService");
const auditEvents = require("../constants/auditEvents");
const crypto = require("crypto");

/**
 * Check if a requested action requires administrative approval under active policies.
 */
exports.checkApprovalRequired = async (tenantId, actionType, user, payload, req) => {
    try {
        const policy = await GovernancePolicy.findOne({
            tenantId,
            actionType,
            status: "active"
        });

        if (!policy) {
            return { pendingApproval: false };
        }

        // 1. Enforce IP Access rules if configured
        if (policy.enforcementRules && policy.enforcementRules.allowedIPs && policy.enforcementRules.allowedIPs.length > 0) {
            const clientIp = req ? req.ip : null;
            if (clientIp && !policy.enforcementRules.allowedIPs.includes(clientIp)) {
                await ComplianceRecord.create({
                    tenantId,
                    recordType: "control_failure",
                    title: "IP Restriction Violation",
                    description: `User ${user.email} attempted ${actionType} from unauthorized IP: ${clientIp}`,
                    severity: "high",
                    policyId: policy._id
                });
                throw new Error("Action blocked by governance policy: Unauthorized IP address.");
            }
        }

        // 2. Enforce Time Window rules if configured
        if (policy.enforcementRules && policy.enforcementRules.allowedTimeWindows && policy.enforcementRules.allowedTimeWindows.length > 0) {
            const currentHour = new Date().getHours();
            const isInWindow = policy.enforcementRules.allowedTimeWindows.some(window => {
                return currentHour >= window.startHour && currentHour <= window.endHour;
            });
            if (!isInWindow) {
                await ComplianceRecord.create({
                    tenantId,
                    recordType: "control_failure",
                    title: "Time-Window Policy Violation",
                    description: `User ${user.email} attempted ${actionType} outside allowed working hours (current hour: ${currentHour}:00)`,
                    severity: "medium",
                    policyId: policy._id
                });
                throw new Error("Action blocked by governance policy: Outside permitted execution hours.");
            }
        }

        // 3. Enforce MFA requirement if configured
        if (policy.enforcementRules && policy.enforcementRules.requireMfa) {
            const mfa = await MfaSettings.findOne({ userId: user._id, isEnabled: true });
            if (!mfa) {
                await ComplianceRecord.create({
                    tenantId,
                    recordType: "control_failure",
                    title: "MFA Policy Violation",
                    description: `User ${user.email} attempted ${actionType} without active Multi-Factor Authentication.`,
                    severity: "high",
                    policyId: policy._id
                });
                throw new Error("Action blocked by governance policy: Multi-Factor Authentication must be enabled.");
            }
        }

        // 4. Return if approval workflow is linked
        if (policy.approvalWorkflowId) {
            const workflow = await ApprovalWorkflow.findById(policy.approvalWorkflowId);
            if (workflow && workflow.status === "active") {
                return {
                    pendingApproval: true,
                    policy,
                    workflow
                };
            }
        }

        return { pendingApproval: false };
    } catch (error) {
        throw error;
    }
};

/**
 * Initiate an Approval Request.
 */
exports.initiateApproval = async (tenantId, requesterId, actionType, payload, reason, policy, workflow, changeTrack = {}) => {
    try {
        const approvalRequest = new ApprovalRequest({
            tenantId,
            requesterId,
            requestType: actionType,
            status: "pending",
            reason,
            payload,
            workflowId: workflow._id,
            currentStep: 1,
            changeTrack
        });

        await approvalRequest.save();

        // Log audit event & publish to event bus
        await auditService.logEvent({
            tenantId,
            actorUserId: requesterId,
            action: auditEvents.APPROVAL_REQUESTED,
            category: "Governance",
            resourceType: "ApprovalRequest",
            resourceId: approvalRequest._id,
            metadata: { requestType: actionType, reason }
        });

        return approvalRequest;
    } catch (error) {
        console.error("Failed to initiate approval request:", error);
        throw error;
    }
};

/**
 * Executes the business action recorded inside an approved Approval Request.
 */
exports.executeApprovedAction = async (requestId) => {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) throw new Error("Approval request not found");
    if (request.status !== "approved") throw new Error("Request must be approved before execution");

    request.status = "completed";
    const { tenantId, payload, requestType, requesterId } = request;

    try {
        switch (requestType) {
            case "APPLICATION_INSTALLATION": {
                const { marketplaceAppId, customRedirectUris } = payload;
                const mApp = await MarketplaceApplication.findOne({ _id: marketplaceAppId, status: "published" });
                if (!mApp) throw new Error("Marketplace Application not found");

                const pkg = await ApplicationPackage.findOne({ marketplaceAppId: mApp._id });
                if (!pkg) throw new Error("Application Package not configured");

                let tenantApp = await TenantApplication.findOne({ tenantId, marketplaceAppId });
                if (tenantApp && tenantApp.status === "active") {
                    throw new Error("Application already installed");
                }

                const clientId = `${mApp.code.toLowerCase()}-${crypto.randomBytes(4).toString("hex")}`;
                let finalRedirectUris = [...pkg.redirectUris];
                if (customRedirectUris && Array.isArray(customRedirectUris)) {
                    finalRedirectUris = [...new Set([...finalRedirectUris, ...customRedirectUris])];
                }

                // 1. Create Local OAuth Application
                const localApp = await Application.create({
                    tenantId,
                    ownerId: requesterId,
                    name: mApp.name,
                    code: mApp.code,
                    frontendUrl: "#",
                    backendUrl: "#",
                    version: mApp.version,
                    description: mApp.description,
                    icon: mApp.icon,
                    clientId,
                    clientType: pkg.clientType,
                    redirectUris: finalRedirectUris,
                    postLogoutRedirectUris: pkg.postLogoutRedirectUris,
                    status: "active"
                });

                if (pkg.clientType === "confidential") {
                    const clientSecretStr = crypto.randomBytes(32).toString("hex");
                    const secretHash = crypto.createHash("sha256").update(clientSecretStr).digest("hex");
                    await ApplicationSecret.create({
                        tenantId,
                        applicationId: localApp._id,
                        secretHash,
                        status: "active"
                    });
                }

                await SecurityPolicy.create({
                    tenantId,
                    applicationId: localApp._id
                });

                const permIdMap = {};
                for (const p of pkg.defaultPermissions) {
                    const newPerm = await Permission.create({
                        tenantId,
                        applicationId: localApp._id,
                        name: p.name,
                        code: `${localApp.code}_${p.code}`.toUpperCase(),
                        resource: p.resource,
                        action: p.action,
                        description: p.description
                    });
                    permIdMap[p.code] = newPerm._id;
                }

                const roleIdMap = {};
                for (const r of pkg.defaultRoles) {
                    const newRole = await Role.create({
                        tenantId,
                        applicationId: localApp._id,
                        name: r.name,
                        code: `${localApp.code}_${r.code}`.toUpperCase(),
                        description: r.description,
                        roleType: "APPLICATION"
                    });
                    roleIdMap[r.code] = newRole._id;
                }

                for (const rule of pkg.defaultProvisioningRules) {
                    if (roleIdMap[rule.roleCode]) {
                        await ApplicationProvisioningRule.create({
                            tenantId,
                            applicationId: localApp._id,
                            roleId: roleIdMap[rule.roleCode],
                            mappedGroups: rule.mappedGroups,
                            autoProvision: rule.autoProvision,
                            status: "active"
                        });
                    }
                }

                if (tenantApp) {
                    tenantApp.status = "active";
                    tenantApp.localApplicationId = localApp._id;
                    tenantApp.installedBy = requesterId;
                    tenantApp.installedAt = new Date();
                    await tenantApp.save();
                } else {
                    tenantApp = await TenantApplication.create({
                        tenantId,
                        marketplaceAppId: mApp._id,
                        localApplicationId: localApp._id,
                        installedBy: requesterId
                    });
                }

                const defaultPlan = await SubscriptionPlan.findOne({ marketplaceAppId: mApp._id, status: 'active', price: 0 });
                if (defaultPlan) {
                    let subscription = await TenantSubscription.findOne({ tenantId, marketplaceAppId: mApp._id });
                    if (!subscription) {
                        await TenantSubscription.create({
                            tenantId,
                            marketplaceAppId: mApp._id,
                            planId: defaultPlan._id,
                            status: 'active'
                        });
                    }
                }

                await auditService.logEvent({
                    tenantId,
                    actorUserId: requesterId,
                    action: auditEvents.APPLICATION_INSTALLED,
                    category: "Marketplace",
                    resourceType: "Application",
                    resourceId: localApp._id
                });
                break;
            }

            case "APPLICATION_REMOVAL": {
                const { marketplaceAppId } = payload;
                const tenantApp = await TenantApplication.findOne({ tenantId, marketplaceAppId });
                if (!tenantApp || tenantApp.status === "uninstalled") throw new Error("Application not installed");

                const localApp = await Application.findOne({ _id: tenantApp.localApplicationId, tenantId });
                if (localApp) {
                    localApp.status = "inactive";
                    await localApp.save();
                    await Session.updateMany({ applicationId: localApp._id }, { status: "revoked" });
                    await RefreshToken.updateMany({ applicationId: localApp._id }, { revoked: true });
                }

                tenantApp.status = "uninstalled";
                await tenantApp.save();

                await TenantSubscription.updateMany(
                    { tenantId, marketplaceAppId, status: "active" },
                    { status: "cancelled" }
                );

                if (localApp) {
                    await auditService.logEvent({
                        tenantId,
                        actorUserId: requesterId,
                        action: auditEvents.APPLICATION_UNINSTALLED,
                        category: "Marketplace",
                        resourceType: "Application",
                        resourceId: localApp._id
                    });
                }
                break;
            }

            case "ROLE_ASSIGNMENT": {
                const { userId, roleIds } = payload;
                const user = await User.findOne({ tenantId, _id: userId });
                if (!user) throw new Error("User not found");

                const validRoles = await Role.find({ tenantId, _id: { $in: roleIds } });
                if (validRoles.length !== roleIds.length) throw new Error("One or more roles invalid");

                const existingAssignments = await UserRole.find({ tenantId, userId, roleId: { $in: roleIds } });
                const existingRoleIds = existingAssignments.map(a => a.roleId.toString());

                const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));
                if (newRoleIds.length > 0) {
                    const newAssignments = newRoleIds.map(rId => ({
                        tenantId,
                        userId,
                        roleId: rId,
                        status: "active",
                        assignedBy: requesterId
                    }));
                    await UserRole.insertMany(newAssignments);
                }

                await auditService.logEvent({
                    tenantId,
                    actorUserId: requesterId,
                    action: auditEvents.ROLE_ASSIGNED,
                    category: "Roles",
                    resourceType: "User",
                    resourceId: userId,
                    targetUserId: userId
                });
                break;
            }

            case "PERMISSION_ESCALATION": {
                const { roleId, permissionIds } = payload;
                const role = await Role.findOne({ tenantId, _id: roleId });
                if (!role) throw new Error("Role not found");

                const validPermissions = await Permission.find({ tenantId, _id: { $in: permissionIds } });
                if (validPermissions.length !== permissionIds.length) throw new Error("One or more permissions invalid");

                const existingAssignments = await RolePermission.find({ tenantId, roleId, permissionId: { $in: permissionIds } });
                const existingPermissionIds = existingAssignments.map(a => a.permissionId.toString());

                const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
                if (newPermissionIds.length > 0) {
                    const newAssignments = newPermissionIds.map(permId => ({
                        tenantId,
                        roleId,
                        permissionId: permId,
                        status: "active",
                        assignedBy: requesterId
                    }));
                    await RolePermission.insertMany(newAssignments);
                }

                await auditService.logEvent({
                    tenantId,
                    actorUserId: requesterId,
                    action: auditEvents.PERMISSION_GRANTED,
                    category: "Permissions",
                    resourceType: "Role",
                    resourceId: roleId
                });
                break;
            }

            case "WORKFLOW_PUBLISHING": {
                const { workflowId, workflowData } = payload;
                if (workflowId) {
                    const workflow = await WorkflowDefinition.findOneAndUpdate(
                        { _id: workflowId, tenantId },
                        { ...workflowData, status: "active" },
                        { returnDocument: 'after' }
                    );
                    if (!workflow) throw new Error("Workflow not found");
                    await auditService.logEvent({
                        tenantId,
                        actorUserId: requesterId,
                        action: auditEvents.WORKFLOW_UPDATED,
                        category: "Workflows",
                        resourceType: "WorkflowDefinition",
                        resourceId: workflow._id
                    });
                } else {
                    const workflow = new WorkflowDefinition({
                        ...workflowData,
                        tenantId,
                        createdBy: requesterId,
                        status: "active"
                    });
                    await workflow.save();
                    await auditService.logEvent({
                        tenantId,
                        actorUserId: requesterId,
                        action: auditEvents.WORKFLOW_CREATED,
                        category: "Workflows",
                        resourceType: "WorkflowDefinition",
                        resourceId: workflow._id
                    });
                }
                break;
            }

            case "SECRET_ROTATION": {
                const { applicationId, gracePeriodHours } = payload;
                const application = await Application.findOne({ _id: applicationId, tenantId });
                if (!application) throw new Error("Application not found");

                const now = new Date();
                const expiresAt = new Date(now.getTime() + (gracePeriodHours || 24) * 60 * 60 * 1000);

                await ApplicationSecret.updateMany(
                    { applicationId: application._id, status: "active" },
                    { status: "legacy", expiresAt }
                );

                const newSecret = crypto.randomBytes(32).toString("hex");
                const secretHash = crypto.createHash("sha256").update(newSecret).digest("hex");

                await ApplicationSecret.create({
                    tenantId,
                    applicationId: application._id,
                    secretHash,
                    status: "active"
                });

                await auditService.logEvent({
                    tenantId,
                    actorUserId: requesterId,
                    action: auditEvents.CLIENT_SECRET_ROTATED || "client_secret_rotated",
                    category: "SSO",
                    resourceType: "Application",
                    resourceId: applicationId
                });
                break;
            }

            case "MARKETPLACE_PUBLISHING": {
                const { marketplaceAppId } = payload;
                const mApp = await MarketplaceApplication.findById(marketplaceAppId);
                if (!mApp) throw new Error("Application not found");

                mApp.status = "published";
                await mApp.save();

                await auditService.logEvent({
                    tenantId,
                    actorUserId: requesterId,
                    action: auditEvents.APPLICATION_PUBLISHED,
                    category: "Marketplace",
                    resourceType: "MarketplaceApplication",
                    resourceId: marketplaceAppId
                });
                break;
            }

            case "SUBSCRIPTION_UPGRADE": {
                const { marketplaceAppId, planId } = payload;
                const plan = await SubscriptionPlan.findById(planId);
                if (!plan || plan.marketplaceAppId.toString() !== marketplaceAppId || plan.status !== 'active') {
                    throw new Error("Invalid or inactive plan");
                }

                let subscription = await TenantSubscription.findOne({ tenantId, marketplaceAppId });
                if (subscription) {
                    const oldPlan = await SubscriptionPlan.findById(subscription.planId);
                    subscription.planId = planId;
                    subscription.status = 'active';
                    await subscription.save();

                    await auditService.logEvent({
                        tenantId,
                        actorUserId: requesterId,
                        action: auditEvents.PLAN_UPGRADED,
                        category: "Subscriptions",
                        resourceType: "TenantSubscription",
                        resourceId: subscription._id,
                        metadata: { oldPlanId: oldPlan?._id, newPlanId: planId }
                    });
                } else {
                    subscription = new TenantSubscription({
                        tenantId,
                        marketplaceAppId,
                        planId,
                        status: 'active'
                    });
                    await subscription.save();

                    await auditService.logEvent({
                        tenantId,
                        actorUserId: requesterId,
                        action: auditEvents.PLAN_ASSIGNED,
                        category: "Subscriptions",
                        resourceType: "TenantSubscription",
                        resourceId: subscription._id,
                        metadata: { planId }
                    });
                }
                break;
            }

            default:
                throw new Error(`Unsupported action type: ${requestType}`);
        }

        await request.save();
    } catch (error) {
        request.status = "failed";
        request.decisionNotes = error.message;
        await request.save();
        throw error;
    }
};
