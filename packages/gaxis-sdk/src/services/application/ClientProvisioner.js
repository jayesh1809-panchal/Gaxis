const crypto = require('crypto');

/**
 * Client Provisioner
 * Provisions OAuth Client IDs and invokes the Secret Manager.
 */
class ClientProvisioner {
    constructor(sdkInstance, secretManager) {
        this.sdk = sdkInstance;
        this.secretManager = secretManager;
    }

    generateClientId() {
        return crypto.randomUUID();
    }

    async provisionClient(applicationCode) {
        const clientId = this.generateClientId();
        const clientSecret = await this.secretManager.rotateSecret(clientId);

        return {
            clientId,
            clientSecret
        };
    }
}

module.exports = ClientProvisioner;
