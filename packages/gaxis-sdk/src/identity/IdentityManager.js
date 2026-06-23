const FieldMapper = require('./FieldMapper');
const ProfileSyncManager = require('./ProfileSyncManager');
const UserProvisioningManager = require('./UserProvisioningManager');

/**
 * Identity Engine Facade
 * Bridges G-Axis OIDC claims with the local application's database.
 */
class IdentityManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;

        if (!this.sdk.config.userAdapter) {
            this.sdk.logger.warn("No userAdapter provided in SDK config. Identity Engine is disabled.");
            this.adapter = null;
            return;
        }

        this.adapter = this.sdk.config.userAdapter;
        this.mapper = new FieldMapper(this.sdk);
        this.syncManager = new ProfileSyncManager(this.sdk, this.adapter, this.mapper);
        this.provisioningManager = new UserProvisioningManager(this.sdk, this.adapter, this.mapper, this.syncManager);

        // Define identity-specific events
        Object.assign(this.sdk.events.events, {
            PROFILE_SYNCED: 'profile:synced',
            USER_CREATED: 'user:created',
            USER_PENDING_APPROVAL: 'user:pending_approval'
        });
    }

    /**
     * Retrieves the current local user based on the G-Axis ID.
     * @param {string} gaxisUserId 
     */
    async getCurrentUser(gaxisUserId) {
        if (!this.adapter) throw new Error("Identity Engine is disabled.");
        return this.adapter.findByGAxisId(gaxisUserId);
    }

    /**
     * Main entry point to provision or update a user upon login.
     * @param {Object} idTokenPayload 
     */
    async provisionUser(idTokenPayload) {
        if (!this.adapter) return idTokenPayload; // Passthrough if disabled
        return this.provisioningManager.provisionUser(idTokenPayload);
    }

    /**
     * Forces a deep sync of the profile.
     * @param {Object} localUser 
     * @param {Object} idTokenPayload 
     */
    async syncProfile(localUser, idTokenPayload) {
        if (!this.adapter) throw new Error("Identity Engine is disabled.");
        return this.syncManager.syncProfile(localUser, idTokenPayload);
    }

    /**
     * Manually links a local user to a G-Axis ID.
     * @param {string|number} localUserId 
     * @param {string} gaxisUserId 
     */
    async linkIdentity(localUserId, gaxisUserId) {
        if (!this.adapter) throw new Error("Identity Engine is disabled.");
        return this.adapter.link(localUserId, gaxisUserId);
    }

    /**
     * Unlinks a local user from G-Axis.
     * @param {string|number} localUserId 
     */
    async unlinkIdentity(localUserId) {
        if (!this.adapter) throw new Error("Identity Engine is disabled.");
        return this.adapter.unlink(localUserId);
    }
}

module.exports = IdentityManager;
