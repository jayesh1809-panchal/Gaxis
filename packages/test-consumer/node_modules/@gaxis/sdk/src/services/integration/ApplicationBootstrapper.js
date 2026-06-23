const ExpressAdapter = require('./adapters/ExpressAdapter');
const ReactAdapter = require('./adapters/ReactAdapter');
// Other adapters can be registered here in the future

class ApplicationBootstrapper {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
        this.adapters = {
            express: new ExpressAdapter(),
            react: new ReactAdapter(),
            // Default fallback if unknown
            default: {
                async bootstrap(appRecord) {
                    sdkInstance.logger.warn(`No specific adapter found for framework ${appRecord.framework}. Skipping bootstrap code generation.`);
                    return null;
                }
            }
        };
    }

    async bootstrap(manifest, applicationRecord) {
        const framework = (manifest.framework || '').toLowerCase();
        const adapter = this.adapters[framework] || this.adapters['default'];
        
        try {
            const generatedFilePath = await adapter.bootstrap(applicationRecord);
            if (generatedFilePath) {
                this.sdk.logger.info(`Generated application bootstrap code at ${generatedFilePath}`);
            }
        } catch (error) {
            throw new Error(`Application Bootstrap Failed: ${error.message}`);
        }
    }
}

module.exports = ApplicationBootstrapper;
