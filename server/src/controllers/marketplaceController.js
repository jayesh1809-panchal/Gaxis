const crypto = require("crypto");
const MarketplaceApplication = require("../models/MarketplaceApplication");
const ApplicationPackage = require("../models/ApplicationPackage");
const TenantApplication = require("../models/TenantApplication");
const Application = require("../models/Application");
const ApplicationSecret = require("../models/ApplicationSecret");
const SecurityPolicy = require("../models/SecurityPolicy");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const ApplicationProvisioningRule = require("../models/ApplicationProvisioningRule");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const TenantSubscription = require("../models/TenantSubscription");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// --- TENANT FACING ROUTES ---

exports.getMarketplaceApplications = async (req, res) => {
    try {
        const apps = await MarketplaceApplication.find({ status: "published" });
        res.status(200).json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMarketplaceApplicationDetails = async (req, res) => {
    try {
        const app = await MarketplaceApplication.findOne({ _id: req.params.id, status: "published" });
        if (!app) return res.status(404).json({ success: false, message: "Application not found" });

        const pkg = await ApplicationPackage.findOne({ marketplaceAppId: app._id });
        
        res.status(200).json({ success: true, data: { application: app, package: pkg } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.installApplication = async (req, res) => {
    try {
        const marketplaceAppId = req.params.id;
        const tenantId = req.tenant._id;
        const { customRedirectUris, reason } = req.body;

        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(tenantId, "APPLICATION_INSTALLATION", req.user, { marketplaceAppId, customRedirectUris }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                tenantId,
                req.user._id,
                "APPLICATION_INSTALLATION",
                { marketplaceAppId, customRedirectUris },
                reason || "Request application installation",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Application installation requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const mApp = await MarketplaceApplication.findOne({ _id: marketplaceAppId, status: "published" });
        if (!mApp) return res.status(404).json({ success: false, message: "Marketplace Application not found" });

        const pkg = await ApplicationPackage.findOne({ marketplaceAppId: mApp._id });
        if (!pkg) return res.status(400).json({ success: false, message: "Application Package not configured" });

        let tenantApp = await TenantApplication.findOne({ tenantId, marketplaceAppId });
        if (tenantApp && tenantApp.status === "active") {
            return res.status(400).json({ success: false, message: "Application already installed" });
        }

        // Generate Client ID
        const clientId = `${mApp.code.toLowerCase()}-${crypto.randomBytes(4).toString("hex")}`;
        
        // Setup Redirect URIs (Combine default with requested custom)
        let finalRedirectUris = [...pkg.redirectUris];
        if (customRedirectUris && Array.isArray(customRedirectUris)) {
            finalRedirectUris = [...new Set([...finalRedirectUris, ...customRedirectUris])];
        }

        // 1. Create Local OAuth Application
        const localApp = await Application.create({
            tenantId,
            ownerId: req.user._id,
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

        let clientSecretStr = null;
        if (pkg.clientType === "confidential") {
            clientSecretStr = crypto.randomBytes(32).toString("hex");
            const secretHash = crypto.createHash("sha256").update(clientSecretStr).digest("hex");
            await ApplicationSecret.create({
                tenantId,
                applicationId: localApp._id,
                secretHash,
                status: "active"
            });
        }

        // 2. Initialize Security Policy
        await SecurityPolicy.create({
            tenantId,
            applicationId: localApp._id
        });

        // 3. Provision Permissions
        const permIdMap = {}; // Maps package permission code to local _id
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

        // 4. Provision Roles
        const roleIdMap = {};
        for (const r of pkg.defaultRoles) {
            const newRole = await Role.create({
                tenantId,
                applicationId: localApp._id,
                name: r.name,
                code: `${localApp.code}_${r.code}`.toUpperCase(),
                description: r.description,
                type: "custom"
            });
            roleIdMap[r.code] = newRole._id;
        }

        // We assume pkg.defaultRoles contains the permission mappings if we expand it later, 
        // but for now, we leave them bare or map all if defined.
        
        // 5. Provision Rules
        for (const rule of pkg.defaultProvisioningRules) {
            if (roleIdMap[rule.roleCode]) {
                await ApplicationProvisioningRule.create({
                    tenantId,
                    applicationId: localApp._id,
                    roleId: roleIdMap[rule.roleCode],
                    mappedGroups: rule.mappedGroups,
                    autoProvision: rule.autoProvision,
                    isActive: true
                });
            }
        }

        // 6. Record Installation
        if (tenantApp) {
            // Re-install
            tenantApp.status = "active";
            tenantApp.localApplicationId = localApp._id;
            tenantApp.installedBy = req.user._id;
            tenantApp.installedAt = new Date();
            await tenantApp.save();
        } else {
            tenantApp = await TenantApplication.create({
                tenantId,
                marketplaceAppId: mApp._id,
                localApplicationId: localApp._id,
                installedBy: req.user._id
            });
        }

        // 7. Subscribe to default free plan if available
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

                await auditService.logEvent(
                    auditEvents.PLAN_ASSIGNED,
                    req.user._id,
                    tenantId,
                    { marketplaceAppId: mApp._id, planId: defaultPlan._id },
                    req.ip
                );
            }
        }

        auditService.logSsoEvent(req, auditEvents.APPLICATION_INSTALLED, localApp._id, { marketplaceAppId: mApp._id });

        res.status(200).json({ 
            success: true, 
            message: "Application installed successfully", 
            data: {
                applicationId: localApp._id,
                clientId: localApp.clientId,
                clientSecret: clientSecretStr // Shown exactly once!
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uninstallApplication = async (req, res) => {
    try {
        const marketplaceAppId = req.params.id;
        const tenantId = req.tenant._id;
        const { reason } = req.body;

        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(tenantId, "APPLICATION_REMOVAL", req.user, { marketplaceAppId }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                tenantId,
                req.user._id,
                "APPLICATION_REMOVAL",
                { marketplaceAppId },
                reason || "Request application removal",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Application removal requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const tenantApp = await TenantApplication.findOne({ tenantId, marketplaceAppId });
        if (!tenantApp || tenantApp.status === "uninstalled") {
            return res.status(404).json({ success: false, message: "Installation not found or already uninstalled" });
        }

        const localApp = await Application.findOne({ _id: tenantApp.localApplicationId, tenantId });
        
        if (localApp) {
            // Disable App
            localApp.status = "inactive";
            await localApp.save();

            // Revoke all sessions
            await Session.updateMany({ applicationId: localApp._id }, { status: "revoked" });
            await RefreshToken.updateMany({ applicationId: localApp._id }, { revoked: true });
        }

        tenantApp.status = "uninstalled";
        await tenantApp.save();

        // Cancel Active Subscriptions
        await TenantSubscription.updateMany(
            { tenantId, marketplaceAppId, status: "active" },
            { status: "cancelled" }
        );

        if (localApp) {
            auditService.logSsoEvent(req, auditEvents.APPLICATION_UNINSTALLED, localApp._id, { marketplaceAppId });
        }

        res.status(200).json({ success: true, message: "Application uninstalled successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInstalledApplications = async (req, res) => {
    try {
        const installations = await TenantApplication.find({ tenantId: req.tenant._id, status: "active" })
            .populate("marketplaceAppId")
            .populate("localApplicationId");
        
        res.status(200).json({ success: true, data: installations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- SYSTEM ADMIN ROUTES ---

exports.publishApplication = async (req, res) => {
    try {
        if (req.user.roleType !== "SYSTEM") return res.status(403).json({ success: false, message: "Not authorized" });

        const { name, code, category, description, version, icon, screenshots } = req.body;

        const mApp = await MarketplaceApplication.create({
            name,
            code,
            category,
            description,
            version,
            icon,
            screenshots,
            publisherId: req.user._id,
            status: "draft"
        });

        res.status(201).json({ success: true, data: mApp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePackage = async (req, res) => {
    try {
        if (req.user.roleType !== "SYSTEM") return res.status(403).json({ success: false, message: "Not authorized" });

        const marketplaceAppId = req.params.id;
        const packageData = req.body;

        const mApp = await MarketplaceApplication.findById(marketplaceAppId);
        if (!mApp) return res.status(404).json({ success: false, message: "Application not found" });

        let pkg = await ApplicationPackage.findOne({ marketplaceAppId });
        if (pkg) {
            Object.assign(pkg, packageData);
            await pkg.save();
        } else {
            pkg = await ApplicationPackage.create({ marketplaceAppId, ...packageData });
        }

        mApp.status = "published";
        await mApp.save();

        res.status(200).json({ success: true, data: pkg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
