/**
 * Logout Listener
 * Receives webhooks and acts upon them locally.
 */
class LogoutListener {
    constructor(sdkInstance, revocationManager) {
        this.sdk = sdkInstance;
        this.revocationManager = revocationManager;
    }

    /**
     * Parses incoming SLO webhook and destroys local state.
     * Exposes an Express route handler implicitly.
     */
    async receiveLogout(payload) {
        this.sdk.logger.info(`Received SLO Payload: ${JSON.stringify(payload)}`);
        this.sdk.events.emitEvent('slo:received', { payload });

        if (payload.event === 'slo:initiated' && payload.userId) {
            // Destroy local sessions for this user
            await this.revocationManager.revokeUserSessions(payload.userId);
            this.sdk.events.emitEvent('slo:completed', { userId: payload.userId });
        }
    }
}

module.exports = LogoutListener;
