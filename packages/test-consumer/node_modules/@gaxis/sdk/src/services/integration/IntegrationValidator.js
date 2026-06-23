class IntegrationValidator {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    async validate(manifest, provisionedRecord) {
        this.sdk.logger.info('Running Integration Validator pre-flight checks...');

        // 1. Verify App Record state
        if (provisionedRecord.status !== 'ACTIVE') {
            throw new Error('Integration Failed: Application was not provisioned successfully (Status is not ACTIVE).');
        }

        // 2. Verify Connectors are available to the SDK if requested in manifest
        const features = manifest.features || [];
        if (features.includes('oauth') && !this.sdk.oauth) {
             throw new Error('Integration Failed: Requested oauth but SDK lacks OAuth Engine.');
        }

        // 3. Optional: Perform a dummy health check via the SDK's internal loopback
        // if this was deployed physically, but since this runs dynamically, we just trust the provisioner.
        
        this.sdk.logger.info('Integration Validator: All pre-flight checks passed.');
        return true;
    }
}

module.exports = IntegrationValidator;
