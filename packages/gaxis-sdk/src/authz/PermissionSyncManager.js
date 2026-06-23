/**
 * Permission Sync Manager
 * Persists and retrieves local mapped permissions.
 */
class PermissionSyncManager {
    constructor(sdkInstance, mapper) {
        this.sdk = sdkInstance;
        this.mapper = mapper;
    }

    /**
     * Synchronizes permissions for a given local user.
     * Overwrites existing permissions (Strict Sync).
     * @param {string|number} localUserId 
     * @param {string[]} gaxisPermissions 
     * @returns {Promise<string[]>}
     */
    async syncPermissions(localUserId, gaxisPermissions) {
        const mappedPermissions = this.mapper.mapPermissions(gaxisPermissions);
        
        this.sdk.logger.debug(`Syncing permissions for ${localUserId}: ${mappedPermissions.join(', ')}`);
        
        await this.sdk.storage.set(`user_permissions_${localUserId}`, JSON.stringify(mappedPermissions));

        this.sdk.events.emitEvent('permissions:synced', { localUserId, permissions: mappedPermissions });
        return mappedPermissions;
    }

    /**
     * Retrieves synchronized permissions for a user.
     * @param {string|number} localUserId 
     * @returns {Promise<string[]>}
     */
    async getPermissions(localUserId) {
        const permsStr = await this.sdk.storage.get(`user_permissions_${localUserId}`);
        return permsStr ? JSON.parse(permsStr) : [];
    }
}

module.exports = PermissionSyncManager;
