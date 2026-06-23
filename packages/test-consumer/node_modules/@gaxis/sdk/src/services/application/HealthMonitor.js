const axios = require('axios');

/**
 * Health Monitor
 * Actively monitors registered applications' backend endpoints.
 */
class HealthMonitor {
    constructor(sdkInstance, registry) {
        this.sdk = sdkInstance;
        this.registry = registry;
    }

    async checkHealth(applicationId) {
        const app = await this.registry.get(applicationId);
        if (!app) throw new Error('Application not found');
        if (!app.healthEndpoint) return { status: 'UNKNOWN', reason: 'No health endpoint defined' };

        try {
            const res = await axios.get(app.healthEndpoint, { timeout: 5000 });
            if (app.status !== 'ACTIVE') {
                app.status = 'ACTIVE';
                await this.registry.save(app);
                this.sdk.events.emitEvent('health:changed', { applicationId, status: 'ACTIVE' });
            }
            return { status: 'ACTIVE', data: res.data };
        } catch (error) {
            if (app.status !== 'INACTIVE') {
                app.status = 'INACTIVE';
                await this.registry.save(app);
                this.sdk.events.emitEvent('health:changed', { applicationId, status: 'INACTIVE', error: error.message });
            }
            return { status: 'INACTIVE', reason: error.message };
        }
    }
}

module.exports = HealthMonitor;
