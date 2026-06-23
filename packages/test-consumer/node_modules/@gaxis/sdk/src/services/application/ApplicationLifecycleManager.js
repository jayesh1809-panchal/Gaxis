const ApplicationRegistry = require('./ApplicationRegistry');
const ClientProvisioner = require('./ClientProvisioner');
const SecretManager = require('./SecretManager');
const ScopeManager = require('./ScopeManager');
const ApplicationProvisioner = require('./ApplicationProvisioner');
const HealthMonitor = require('./HealthMonitor');

/**
 * Application Lifecycle Manager (Facade)
 */
class ApplicationLifecycleManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;

        this.registry = new ApplicationRegistry(this.sdk);
        this.secretManager = new SecretManager(this.sdk);
        this.clientProvisioner = new ClientProvisioner(this.sdk, this.secretManager);
        this.scopeManager = new ScopeManager(this.sdk);
        this.provisioner = new ApplicationProvisioner(this.sdk, this.clientProvisioner, this.scopeManager);
        this.healthMonitor = new HealthMonitor(this.sdk, this.registry);
    }

    /**
     * Registers and provisions a new ecosystem application.
     */
    async registerApplication(config) {
        // 1. Provision all required infrastructure
        const { record, clientSecret } = await this.provisioner.provision(config);
        
        // 2. Save to central registry
        await this.registry.save(record);

        this.sdk.events.emitEvent('application:registered', { applicationId: record.applicationId });

        return {
            application: record,
            clientSecret
        };
    }

    async getApplication(applicationId) {
        return this.registry.get(applicationId);
    }

    async updateApplication(applicationId, updates) {
        const app = await this.registry.get(applicationId);
        if (!app) throw new Error('Application not found');
        
        const updatedApp = { ...app, ...updates };
        await this.registry.save(updatedApp);
        
        this.sdk.events.emitEvent('application:updated', { applicationId });
        return updatedApp;
    }

    async deactivateApplication(applicationId) {
        const app = await this.updateApplication(applicationId, { status: 'INACTIVE' });
        this.sdk.events.emitEvent('application:deactivated', { applicationId });
        return app;
    }

    async rotateSecret(applicationId) {
        return this.secretManager.rotateSecret(applicationId);
    }

    async checkHealth(applicationId) {
        return this.healthMonitor.checkHealth(applicationId);
    }
}

module.exports = ApplicationLifecycleManager;
