/**
 * Upgrade Manager
 * Orchestrates safe version upgrades of installed packages.
 */
class UpgradeManager {
    constructor(sdkInstance, installer) {
        this.sdk = sdkInstance;
        this.installer = installer;
    }

    async upgrade(packageName) {
        this.sdk.logger.info(`Starting upgrade sequence for: ${packageName}`);
        
        // Since 'publish' overwrites the latest version in our simple registry,
        // 'install' naturally fetches the latest and re-registers the ecosystem entities.
        // In a complex engine, we would diff the permissions and scopes before approving.

        try {
            const updatedApp = await this.installer.install(packageName);
            this.sdk.events.emitEvent('package:updated', { packageName });
            return updatedApp;
        } catch (error) {
            // Simulated rollback logic
            this.sdk.logger.warn(`Upgrade failed for ${packageName}. Rollback not fully implemented in local mode.`);
            throw error;
        }
    }
}

module.exports = UpgradeManager;
