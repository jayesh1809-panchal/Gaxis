const EcosystemRegistry = require("../models/EcosystemRegistry");
const EcosystemWorkspace = require("../models/EcosystemWorkspace");

class EcosystemOSEngine {
    /**
     * Register a new App in the Ecosystem (Internal, Partner, or Marketplace)
     */
    async registerApp(appData) {
        const existing = await EcosystemRegistry.findOne({ appId: appData.appId });
        if (existing) {
            Object.assign(existing, appData);
            return await existing.save();
        }
        return await EcosystemRegistry.create(appData);
    }

    /**
     * Retrieve the Launcher state for a specific user (their workspace)
     */
    async getWorkspace(userId) {
        let workspace = await EcosystemWorkspace.findOne({ userId }).populate("pinnedApps");
        if (!workspace) {
            workspace = await EcosystemWorkspace.create({ userId });
            // Automatically pin default internal apps (e.g., HRMS, CRM if available)
            const defaultApps = await EcosystemRegistry.find({ type: "internal", status: "active" });
            workspace.pinnedApps = defaultApps.map(app => app._id);
            await workspace.save();
            workspace = await EcosystemWorkspace.findById(workspace._id).populate("pinnedApps");
        }
        return workspace;
    }

    /**
     * Pin or unpin an app in the launcher
     */
    async togglePinnedApp(userId, registryId) {
        const workspace = await this.getWorkspace(userId);
        const index = workspace.pinnedApps.findIndex(app => app._id.toString() === registryId.toString());
        
        if (index > -1) {
            workspace.pinnedApps.splice(index, 1); // Unpin
        } else {
            workspace.pinnedApps.push(registryId); // Pin
        }
        
        return await workspace.save();
    }

    /**
     * Get all available apps in the ecosystem that this user is allowed to access
     */
    async getAllAvailableApps(userPermissions = []) {
        // In a real scenario, filter by user permissions. For G-OS, we'll return all active apps
        return await EcosystemRegistry.find({ status: "active" });
    }
}

module.exports = new EcosystemOSEngine();
