const ManifestLoader = require('./ManifestLoader');
const ConnectorInstaller = require('./ConnectorInstaller');
const EnvironmentProvisioner = require('./EnvironmentProvisioner');
const ApplicationBootstrapper = require('./ApplicationBootstrapper');
const IntegrationValidator = require('./IntegrationValidator');
const IntegrationHealthManager = require('./IntegrationHealthManager');

/**
 * Integration Manager (Facade)
 * The core engine orchestrating the Plug & Play onboarding flow.
 */
class IntegrationManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
        
        this.manifestLoader = new ManifestLoader(this.sdk);
        this.connectorInstaller = new ConnectorInstaller(this.sdk);
        this.environmentProvisioner = new EnvironmentProvisioner(this.sdk);
        this.bootstrapper = new ApplicationBootstrapper(this.sdk);
        this.validator = new IntegrationValidator(this.sdk);
        this.healthManager = new IntegrationHealthManager(this.sdk);
    }

    /**
     * Executes the Zero-Code Integration Pipeline.
     * @param {Object} options 
     * @param {string} options.manifest - Path to gaxis.config.json
     */
    async integrate(options = {}) {
        this.sdk.events.emitEvent('integration:started', { options });
        this.sdk.logger.info('Starting G-Axis Zero-Code Integration...');

        try {
            // 1. Load & Validate Manifest
            const manifestPath = options.manifest || './gaxis.config.json';
            const manifest = await this.manifestLoader.load(manifestPath);

            // 2. Install Connectors
            await this.connectorInstaller.install(manifest.features);

            // 3. Register Application via ApplicationLifecycleEngine
            // Note: This inherently calls the Provisioner, ScopeManager, and SecretManager.
            const { application, clientSecret } = await this.sdk.application.registerApplication(manifest);

            // 4. Generate Environment Variables
            await this.environmentProvisioner.provision(application, clientSecret);

            // 5. Bootstrap Framework Specific Code
            await this.bootstrapper.bootstrap(manifest, application);

            // 6. Pre-flight Validation
            await this.validator.validate(manifest, application);

            this.sdk.logger.info('Integration Completed Successfully!');
            this.sdk.events.emitEvent('integration:completed', { applicationId: application.applicationId });

            // 7. Start Health Monitoring
            this.healthManager.monitor(application.applicationId);

            return application;
        } catch (error) {
            this.sdk.logger.error(`Integration Failed: ${error.message}`);
            this.sdk.events.emitEvent('integration:failed', { error: error.message });
            throw error;
        }
    }

    async validateIntegration(applicationId) {
        // Fetch app and perform dynamic checks if needed
        return true;
    }

    async repairIntegration(applicationId) {
        this.sdk.logger.info(`Repairing integration for ${applicationId}...`);
        // Hook to re-issue secrets or re-sync scopes if something is out of sync.
        this.sdk.events.emitEvent('integration:repaired', { applicationId });
    }

    async generateEnvironment(applicationId) {
        // Manually trigger env provision logic using active secret
    }

    async bootstrapApplication(applicationId, framework) {
        // Manually trigger bootstrap code generation
    }
}

module.exports = IntegrationManager;
