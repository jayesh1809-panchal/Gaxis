const {
  v4: uuidv4
} = require('uuid');
const SessionEvents = require('./SessionEvents');
const SessionRegistry = require('./SessionRegistry');
const DeviceManager = require('./DeviceManager');
const ActivityTracker = require('./ActivityTracker');
const SessionValidator = require('./SessionValidator');

/**
 * Session Manager Facade
 * Coordinates session lifecycle directly inside the SDK Storage Layer.
 */
class SessionManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.registry = new SessionRegistry(this.sdk);
    this.deviceManager = new DeviceManager(this.sdk);
    this.activityTracker = new ActivityTracker(this.sdk, this.registry);
    this.validator = new SessionValidator(this.sdk, this.registry, this.deviceManager);
    this._registerEventListeners();
  }
  _registerEventListeners() {
    // Automatically create a session when OAuth and Identity succeed
    this.sdk.events.on(this.sdk.events.events.AUTH_SUCCESS, async data => {
      const {
        localUserId
      } = data;
      if (localUserId) {
        // The actual request context isn't automatically available here unless passed.
        // We assume basic tracking or the dev passes 'req' in via tokenData somehow.
        // For Phase 8.5, we'll let the callback route invoke `createSession` explicitly 
        // or rely on a dummy object if missing.
      }
    });
  }

  /**
   * Creates a new session, registers the device, and stores the payload.
   * @param {string|number} userId 
   * @param {Object} req - The Express request object for fingerprinting
   */
  async createSession(userId, req = {}) {
    const device = await this.deviceManager.registerDevice(req);
    const now = new Date();
    const absoluteTimeout = this.sdk.config.sessionAbsoluteTimeout || 86400;
    const expiresAt = new Date(now.getTime() + absoluteTimeout * 1000);
    const sessionPayload = {
      sessionId: uuidv4(),
      userId,
      applicationId: this.sdk.config.clientId,
      tenantId: this.sdk.config.tenantId || 'default',
      deviceId: device.deviceId,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      loginTime: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'ACTIVE'
    };
    await this.registry.create(sessionPayload);
    this.sdk.events.emitEvent(SessionEvents.SESSION_CREATED, {
      sessionId: sessionPayload.sessionId
    });
    this.sdk.logger.info(`Session created: ${sessionPayload.sessionId} for User: ${userId}`);
    return sessionPayload;
  }
  async getSession(sessionId) {
    return this.registry.get(sessionId);
  }
  async validateSession(sessionId, req = null) {
    const session = await this.validator.validateSession(sessionId, req);
    // Optionally update activity right away
    await this.activityTracker.trackActivity(sessionId);
    return session;
  }
  async revokeSession(sessionId) {
    const session = await this.registry.update(sessionId, {
      status: 'REVOKED'
    });
    this.sdk.events.emitEvent(SessionEvents.SESSION_REVOKED, {
      sessionId
    });
    this.sdk.logger.info(`Session revoked: ${sessionId}`);
    return session;
  }
  async destroySession(sessionId) {
    await this.registry.destroy(sessionId);
    this.sdk.events.emitEvent(SessionEvents.SESSION_DESTROYED, {
      sessionId
    });
    this.sdk.logger.info(`Session destroyed: ${sessionId}`);
  }
  async trackActivity(sessionId) {
    return this.activityTracker.trackActivity(sessionId);
  }
  async getActivity(sessionId) {
    return this.activityTracker.getActivity(sessionId);
  }
}
module.exports = SessionManager;