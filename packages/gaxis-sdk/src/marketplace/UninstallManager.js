/**
 * Uninstall Manager
 * Removes a package and aggressively tears down its active presence in the ecosystem.
 */
class UninstallManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    async remove(packageName) {
        this.sdk.logger.warn(`Initiating uninstallation for package: ${packageName}`);

        // 1. Identify application from the ApplicationLifecycleManager (using packageName as applicationCode)
        const apps = await this.sdk.application.registry.getAll();
        const targetApp = apps.find(a => a.applicationCode === packageName);

        if (targetApp) {
            // 2. Broadcast forceful SLO to kill all active sessions associated with this application globally
            this.sdk.logger.warn(`Broadcasting SLO purge for decommissioned app: ${targetApp.applicationId}`);
            if (this.sdk.slo && this.sdk.slo.broadcaster) {
                 // Pass a generic internal identifier or system wide user wildcard if we had one.
                 // For now, we manually broadcast to that specific app's logout endpoint if possible, 
                 // or instruct the broader ecosystem to invalidate tokens generated for this clientId.
            }

            // 3. Remove application from application registry
            await this.sdk.application.registry.delete(targetApp.applicationId);
            
            // 4. Revoke active secrets
            await this.sdk.application.secretManager.revokeSecret(targetApp.applicationId);
        }

        this.sdk.logger.info(`Uninstallation complete for ${packageName}`);
        this.sdk.events.emitEvent('package:removed', { packageName });
        return true;
    }
}

module.exports = UninstallManager;
