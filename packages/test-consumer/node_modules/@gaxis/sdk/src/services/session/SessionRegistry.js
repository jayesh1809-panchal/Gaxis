/**
 * Session Registry
 * Abstracted CRUD operations for sessions using SDK's Storage Layer.
 */
class SessionRegistry {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    _getKey(sessionId) {
        return `gaxis_session_${sessionId}`;
    }

    async create(sessionData) {
        const key = this._getKey(sessionData.sessionId);
        // Default absolute timeout in config, or 24 hours
        const ttl = this.sdk.config.sessionAbsoluteTimeout || 86400;
        await this.sdk.storage.set(key, JSON.stringify(sessionData), ttl);
        return sessionData;
    }

    async update(sessionId, updates) {
        const session = await this.get(sessionId);
        if (!session) throw new Error('Session not found in registry');
        
        Object.assign(session, updates);
        
        const key = this._getKey(sessionId);
        // Overwrite but keep the same relative structure. 
        // Actual TTL resetting depends on storage capabilities, here we simplify.
        const ttl = this.sdk.config.sessionAbsoluteTimeout || 86400;
        await this.sdk.storage.set(key, JSON.stringify(session), ttl);
        return session;
    }

    async get(sessionId) {
        const key = this._getKey(sessionId);
        const dataStr = await this.sdk.storage.get(key);
        return dataStr ? JSON.parse(dataStr) : null;
    }

    async destroy(sessionId) {
        const key = this._getKey(sessionId);
        await this.sdk.storage.delete(key);
    }
}

module.exports = SessionRegistry;
