const axios = require('axios');

/**
 * Application Provisioner
 * Connects the sub-provisioners and dynamic discovery into one cohesive entity.
 */
class ApplicationProvisioner {
    constructor(sdkInstance, clientProvisioner, scopeManager) {
        this.sdk = sdkInstance;
        this.clientProvisioner = clientProvisioner;
        this.scopeManager = scopeManager;
    }

    /**
     * Attempts to auto-discover an application configuration manifest from its URL.
     */
    async discoverApplication(url) {
        try {
            const wellKnownUrl = new URL('/.well-known/gaxis-application.json', url).toString();
            const res = await axios.get(wellKnownUrl, { timeout: 3000 });
            return res.data;
        } catch (err) {
            this.sdk.logger.warn(`Auto-discovery failed for ${url}: ${err.message}`);
            return null;
        }
    }

    async provision(config) {
        let appData = { ...config };

        // Attempt discovery if frontendUrl is provided but other fields are missing
        if (appData.frontendUrl && !appData.applicationCode) {
            const discovered = await this.discoverApplication(appData.frontendUrl);
            if (discovered) {
                appData = { ...appData, ...discovered };
            }
        }

        if (!appData.applicationCode) {
            throw new Error('Application provisioning failed: missing applicationCode.');
        }

        // 1. Provision OAuth Client & Secret
        const { clientId, clientSecret } = await this.clientProvisioner.provisionClient(appData.applicationCode);

        // 2. Generate Scopes
        const scopes = this.scopeManager.generateScopes(appData.applicationCode);

        // 3. Build Record
        const record = {
            applicationId: clientId,
            applicationCode: appData.applicationCode,
            applicationName: appData.applicationName || appData.applicationCode,
            version: appData.version || '1.0.0',
            owner: appData.owner || 'system',
            status: 'ACTIVE',
            frontendUrl: appData.frontendUrl || '',
            backendUrl: appData.backendUrl || '',
            logoutEndpoint: appData.logoutEndpoint || (appData.backendUrl ? `${appData.backendUrl}/slo/receive` : ''),
            healthEndpoint: appData.healthEndpoint || (appData.backendUrl ? `${appData.backendUrl}/health` : ''),
            redirectUris: appData.redirectUris || (appData.frontendUrl ? [`${appData.frontendUrl}/callback`] : []),
            scopes: scopes,
            createdAt: new Date().toISOString()
        };

        this.sdk.logger.info(`Provisioned Application: ${record.applicationName} (${record.applicationId})`);
        
        return {
            record,
            clientSecret // Only returned once!
        };
    }
}

module.exports = ApplicationProvisioner;
