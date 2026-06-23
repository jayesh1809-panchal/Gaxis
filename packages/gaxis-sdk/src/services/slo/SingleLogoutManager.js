// Deprecated: const ApplicationRegistry = require('./ApplicationRegistry');
const SessionOrchestrator = require('./SessionOrchestrator');
const SessionRevocationManager = require('./SessionRevocationManager');
const LogoutBroadcaster = require('./LogoutBroadcaster');
const LogoutListener = require('./LogoutListener');

/**
 * Single Logout (SLO) Engine Facade
 */
class SingleLogoutManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;

        this.orchestrator = new SessionOrchestrator(this.sdk);
        this.revocationManager = new SessionRevocationManager(this.sdk, this.orchestrator);
        this.broadcaster = new LogoutBroadcaster(this.sdk);
        this.listener = new LogoutListener(this.sdk, this.revocationManager);
    }

    /**
     * Initiates a Global Logout across the ecosystem.
     * Revokes local sessions AND broadcasts webhooks.
     */
    async globalLogout(userId) {
        this.sdk.logger.info(`Initiating Global SLO for user: ${userId}`);
        this.sdk.events.emitEvent('slo:initiated', { userId, type: 'global' });

        // 1. Revoke locally
        await this.localLogout(userId);

        // 2. Broadcast to other apps
        if (this.sdk.config.enableCrossAppLogout !== false) {
            await this.broadcaster.broadcastLogout(userId);
        }
    }

    /**
     * Destroys sessions locally without broadcasting.
     */
    async localLogout(userId) {
        return this.revocationManager.revokeUserSessions(userId);
    }

    async registerApplication(appDetails) {
        this.sdk.logger.warn('slo.registerApplication is deprecated. Use sdk.application.registerApplication instead.');
        // Fallback or throw based on design
        return this.sdk.application.registerApplication(appDetails);
    }

    async receiveLogoutWebhook(payload) {
        return this.listener.receiveLogout(payload);
    }
}

module.exports = SingleLogoutManager;
