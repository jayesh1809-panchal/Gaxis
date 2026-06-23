const { AuthenticationError } = require('../utils/errors');

/**
 * User Provisioning Manager
 * Handles the core state machine for AUTO_CREATE, AUTO_UPDATE, READ_ONLY, and MANUAL_APPROVAL.
 */
class UserProvisioningManager {
    constructor(sdkInstance, adapter, mapper, profileSyncManager) {
        this.sdk = sdkInstance;
        this.adapter = adapter;
        this.mapper = mapper;
        this.syncManager = profileSyncManager;
        
        this.mode = this.sdk.config.provisioningMode || 'AUTO_CREATE';
    }

    /**
     * Main entry point for provisioning an incoming user.
     * @param {Object} idTokenPayload 
     */
    async provisionUser(idTokenPayload) {
        const gaxisUserId = idTokenPayload.sub;
        const email = idTokenPayload.email;

        this.sdk.logger.info(`Starting provisioning cycle for G-Axis User: ${gaxisUserId} (Mode: ${this.mode})`);

        // 1. Check if user already exists via G-Axis ID
        let localUser = await this.adapter.findByGAxisId(gaxisUserId);
        if (localUser) {
            this.sdk.logger.debug('User found via G-Axis ID.');
            if (this.mode === 'AUTO_UPDATE' || this.mode === 'AUTO_CREATE') {
                localUser = await this.syncManager.syncProfile(localUser, idTokenPayload);
            }
            return localUser;
        }

        // 2. Conflict Resolution: Check if user exists via Email
        if (email) {
            localUser = await this.adapter.findByEmail(email);
            if (localUser) {
                this.sdk.logger.warn(`Conflict: User found via email (${email}) but not linked to G-Axis ID.`);
                
                // By default, if the email matches, we assume trust and link the accounts.
                // In a stricter system, an email verification loop might be needed.
                localUser = await this.adapter.link(localUser.id || localUser._id, gaxisUserId);
                this.sdk.logger.info(`Successfully linked existing local user to G-Axis ID: ${gaxisUserId}`);
                
                if (this.mode === 'AUTO_UPDATE' || this.mode === 'AUTO_CREATE') {
                    localUser = await this.syncManager.syncProfile(localUser, idTokenPayload);
                }
                return localUser;
            }
        }

        // 3. User does not exist locally. Handle based on mode.
        if (this.mode === 'READ_ONLY') {
            throw new AuthenticationError('Provisioning is READ_ONLY. Unknown users are rejected.');
        }

        const mappedData = this.mapper.mapToLocal(idTokenPayload);

        if (this.mode === 'MANUAL_APPROVAL') {
            // Insert as pending approval
            mappedData.status = 'PENDING_APPROVAL';
            this.sdk.logger.info('Creating user in PENDING_APPROVAL state.');
            const pendingUser = await this.adapter.create(mappedData);
            this.sdk.events.emitEvent('user:pending_approval', { userId: pendingUser.id || pendingUser._id });
            throw new AuthenticationError('Account requires manual approval by an administrator.');
        }

        if (this.mode === 'AUTO_CREATE' || this.mode === 'AUTO_UPDATE') {
            this.sdk.logger.info('Creating new local user automatically.');
            const newUser = await this.adapter.create(mappedData);
            this.sdk.events.emitEvent('user:created', { userId: newUser.id || newUser._id });
            return newUser;
        }

        throw new Error(`Unknown provisioning mode: ${this.mode}`);
    }
}

module.exports = UserProvisioningManager;
