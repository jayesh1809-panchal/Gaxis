/**
 * Role Sync Manager
 * Persists and retrieves local mapped roles.
 */
class RoleSyncManager {
    constructor(sdkInstance, mapper) {
        this.sdk = sdkInstance;
        this.mapper = mapper;
    }

    /**
     * Synchronizes roles for a given local user.
     * Overwrites existing roles (Strict Sync).
     * @param {string|number} localUserId 
     * @param {string[]} gaxisRoles 
     * @returns {Promise<string[]>}
     */
    async syncRoles(localUserId, gaxisRoles) {
        const mappedRoles = this.mapper.mapRoles(gaxisRoles);
        
        this.sdk.logger.debug(`Syncing roles for ${localUserId}: ${mappedRoles.join(', ')}`);
        
        // In Phase 8.4 we persist these to the SDK's storage layer for fast retrieval.
        // If a DB Adapter with role capability is used, this could also write to the DB.
        await this.sdk.storage.set(`user_roles_${localUserId}`, JSON.stringify(mappedRoles));

        this.sdk.events.emitEvent('roles:synced', { localUserId, roles: mappedRoles });
        return mappedRoles;
    }

    /**
     * Retrieves synchronized roles for a user.
     * @param {string|number} localUserId 
     * @returns {Promise<string[]>}
     */
    async getRoles(localUserId) {
        const rolesStr = await this.sdk.storage.get(`user_roles_${localUserId}`);
        return rolesStr ? JSON.parse(rolesStr) : [];
    }
}

module.exports = RoleSyncManager;
