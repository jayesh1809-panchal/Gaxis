const axios = require('axios');

/**
 * Logout Broadcaster
 * Transmits SLO webhooks to registered applications.
 */
class LogoutBroadcaster {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }

  /**
   * Broadcasts a global SLO event to all registered apps.
   */
  async broadcastLogout(userId) {
    const apps = await this.sdk.application.registry.getAll();
    const promises = apps.map(async app => {
      if (!app.logoutEndpoint) return;
      try {
        // Send the webhook payload indicating slo:initiated for the userId
        await axios.post(app.logoutEndpoint, {
          event: 'slo:initiated',
          userId: userId,
          timestamp: new Date().toISOString()
        }, {
          timeout: this.sdk.config.logoutPropagationTimeout || 5000
        });
        this.sdk.logger.info(`SLO Broadcast success: ${app.applicationName}`);
      } catch (err) {
        // Implement retry logic in a production queue
        this.sdk.logger.warn(`SLO Broadcast failed to ${app.applicationName}: ${err.message}`);
        this.sdk.events.emitEvent('slo:failure', {
          applicationId: app.applicationId,
          error: err.message
        });
      }
    });
    await Promise.allSettled(promises);
    this.sdk.events.emitEvent('slo:broadcasted', {
      userId,
      appCount: apps.length
    });
  }
}
module.exports = LogoutBroadcaster;