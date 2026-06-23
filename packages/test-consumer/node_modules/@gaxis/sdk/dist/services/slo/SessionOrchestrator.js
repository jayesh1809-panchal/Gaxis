/**
 * Session Orchestrator
 * Maintains lookup indices linking users/apps/devices to session IDs.
 */
class SessionOrchestrator {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this._registerHooks();
  }
  _registerHooks() {
    // Listen for session creations from the Phase 8.5 Session Manager
    this.sdk.events.on('session:created', async data => {
      const {
        sessionId
      } = data;
      const session = await this.sdk.session.getSession(sessionId);
      if (session) {
        await this.indexSession(session);
      }
    });
  }
  _getUserIndexKey(userId) {
    return `gaxis_idx_user_${userId}`;
  }
  _getAppIndexKey(applicationId) {
    return `gaxis_idx_app_${applicationId}`;
  }

  /**
   * Adds a session ID to the relevant indices.
   */
  async indexSession(session) {
    if (!session.userId) return;

    // Index by User
    const userKey = this._getUserIndexKey(session.userId);
    let userSessions = JSON.parse((await this.sdk.storage.get(userKey)) || '[]');
    if (!userSessions.includes(session.sessionId)) {
      userSessions.push(session.sessionId);
      await this.sdk.storage.set(userKey, JSON.stringify(userSessions));
    }

    // Index by App
    if (session.applicationId) {
      const appKey = this._getAppIndexKey(session.applicationId);
      let appSessions = JSON.parse((await this.sdk.storage.get(appKey)) || '[]');
      if (!appSessions.includes(session.sessionId)) {
        appSessions.push(session.sessionId);
        await this.sdk.storage.set(appKey, JSON.stringify(appSessions));
      }
    }
  }
  async getUserSessions(userId) {
    const key = this._getUserIndexKey(userId);
    return JSON.parse((await this.sdk.storage.get(key)) || '[]');
  }
  async getApplicationSessions(applicationId) {
    const key = this._getAppIndexKey(applicationId);
    return JSON.parse((await this.sdk.storage.get(key)) || '[]');
  }
}
module.exports = SessionOrchestrator;