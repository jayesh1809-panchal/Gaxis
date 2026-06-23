const EventEmitter = require('events');

/**
 * G-Axis Event Emitter Foundation
 * Handles SDK-wide lifecycle events (e.g., initialized, token_refreshed, session_expired)
 */
class GAxisEventEmitter extends EventEmitter {
    constructor() {
        super();
        // Define standardized event constants
        this.events = {
            SDK_READY: 'sdk:ready',
            SDK_ERROR: 'sdk:error',
            AUTH_SUCCESS: 'auth:success',
            AUTH_FAILURE: 'auth:failure',
            TOKEN_REFRESHED: 'token:refreshed',
            SESSION_EXPIRED: 'session:expired',
            SLO_TRIGGERED: 'slo:triggered'
        };
    }

    emitEvent(event, payload = {}) {
        this.emit(event, {
            timestamp: new Date().toISOString(),
            ...payload
        });
    }
}

module.exports = GAxisEventEmitter;
