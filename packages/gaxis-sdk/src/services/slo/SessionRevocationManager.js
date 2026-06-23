/**
 * Session Revocation Manager
 * Bulk revokes sessions tracked by the Orchestrator.
 */
class SessionRevocationManager {
    constructor(sdkInstance, orchestrator) {
        this.sdk = sdkInstance;
        this.orchestrator = orchestrator;
    }

    /**
     * Revokes all active sessions for a given user.
     */
    async revokeUserSessions(userId) {
        const sessionIds = await this.orchestrator.getUserSessions(userId);
        for (const sessionId of sessionIds) {
            await this.sdk.session.revokeSession(sessionId);
        }
        this.sdk.logger.info(`Bulk revoked ${sessionIds.length} sessions for user ${userId}`);
        return sessionIds;
    }

    /**
     * Revokes all active sessions for a specific application.
     */
    async revokeApplicationSessions(applicationId) {
        const sessionIds = await this.orchestrator.getApplicationSessions(applicationId);
        for (const sessionId of sessionIds) {
            await this.sdk.session.revokeSession(sessionId);
        }
        this.sdk.logger.info(`Bulk revoked ${sessionIds.length} sessions for app ${applicationId}`);
        return sessionIds;
    }
}

module.exports = SessionRevocationManager;
