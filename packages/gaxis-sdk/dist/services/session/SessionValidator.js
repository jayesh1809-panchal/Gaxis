const {
  AuthenticationError
} = require('../../utils/errors');
const SessionEvents = require('./SessionEvents');

/**
 * Session Validator
 * Validates idle timeouts, absolute timeouts, and session statuses.
 */
class SessionValidator {
  constructor(sdkInstance, registry, deviceManager) {
    this.sdk = sdkInstance;
    this.registry = registry;
    this.deviceManager = deviceManager;
    this.idleTimeout = this.sdk.config.sessionIdleTimeout || 1800; // 30 mins
    this.absoluteTimeout = this.sdk.config.sessionAbsoluteTimeout || 86400; // 24 hours
  }

  /**
   * Comprehensive validation of a session.
   * @param {string} sessionId 
   * @param {Object} req - Optionally validate against current request IP/Device
   */
  async validateSession(sessionId, req = null) {
    const session = await this.registry.get(sessionId);
    if (!session) {
      throw new AuthenticationError('Session not found.');
    }
    if (session.status === 'REVOKED') {
      throw new AuthenticationError('Session has been revoked.');
    }
    if (session.status === 'EXPIRED') {
      throw new AuthenticationError('Session has expired.');
    }
    if (session.status === 'LOCKED') {
      throw new AuthenticationError('Session is currently locked.');
    }
    const now = Date.now();

    // Check Absolute Expiry
    const expiresAt = new Date(session.expiresAt).getTime();
    if (now > expiresAt) {
      await this._markExpired(session);
      throw new AuthenticationError('Absolute session timeout reached.');
    }

    // Check Idle Timeout
    const lastActivity = new Date(session.lastActivity).getTime();
    if ((now - lastActivity) / 1000 > this.idleTimeout) {
      await this._markExpired(session);
      throw new AuthenticationError('Session idle timeout reached.');
    }

    // Optional Device Validation (If req is provided and device tracking is on)
    if (req && this.deviceManager.enabled && session.deviceId !== 'untracked') {
      const currentDevice = await this.deviceManager.getDevice(session.deviceId);
      if (currentDevice && currentDevice.status === 'BLOCKED') {
        throw new AuthenticationError('Device has been blocked.');
      }
    }
    return session;
  }
  async _markExpired(session) {
    await this.registry.update(session.sessionId, {
      status: 'EXPIRED'
    });
    this.sdk.events.emitEvent(SessionEvents.SESSION_EXPIRED, {
      sessionId: session.sessionId
    });
    this.sdk.logger.info(`Session expired: ${session.sessionId}`);
  }
}
module.exports = SessionValidator;