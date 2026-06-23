/**
 * Activity Tracker
 * Tracks `lastSeen` and updates activity counters for idle timeouts.
 */
class ActivityTracker {
  constructor(sdkInstance, registry) {
    this.sdk = sdkInstance;
    this.registry = registry;
    this.enabled = this.sdk.config.enableActivityTracking !== false;
  }

  /**
   * Updates the lastActivity timestamp for a session.
   * @param {string} sessionId 
   */
  async trackActivity(sessionId) {
    if (!this.enabled) return;
    try {
      const now = new Date().toISOString();
      await this.registry.update(sessionId, {
        lastActivity: now
      });
      this.sdk.logger.debug(`Activity tracked for session: ${sessionId}`);
    } catch (error) {
      this.sdk.logger.warn(`Failed to track activity for session ${sessionId}: ${error.message}`);
    }
  }
  async getActivity(sessionId) {
    const session = await this.registry.get(sessionId);
    return session ? session.lastActivity : null;
  }
}
module.exports = ActivityTracker;