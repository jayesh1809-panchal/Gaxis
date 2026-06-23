const crypto = require('crypto');

/**
 * Secret Manager
 * Generates and tracks application client secrets securely.
 */
class SecretManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    generateSecret() {
        // Generate a 256-bit cryptographically secure random string
        return crypto.randomBytes(32).toString('hex');
    }

    async getActiveSecret(applicationId) {
        const key = `gaxis_secret_${applicationId}`;
        return await this.sdk.storage.get(key);
    }

    async rotateSecret(applicationId) {
        const newSecret = this.generateSecret();
        const key = `gaxis_secret_${applicationId}`;
        
        await this.sdk.storage.set(key, newSecret);
        
        this.sdk.logger.info(`Secret rotated for application: ${applicationId}`);
        this.sdk.events.emitEvent('secret:rotated', { applicationId });
        
        return newSecret;
    }

    async revokeSecret(applicationId) {
        const key = `gaxis_secret_${applicationId}`;
        await this.sdk.storage.delete(key);
        this.sdk.logger.warn(`Secret revoked for application: ${applicationId}`);
    }
}

module.exports = SecretManager;
