const fs = require('fs/promises');
const path = require('path');

class ManifestLoader {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    async load(manifestPath) {
        try {
            const resolvedPath = path.resolve(process.cwd(), manifestPath);
            const fileContent = await fs.readFile(resolvedPath, 'utf8');
            const manifest = JSON.parse(fileContent);
            this.validate(manifest);
            this.sdk.logger.info(`Loaded manifest from ${resolvedPath}`);
            return manifest;
        } catch (error) {
            throw new Error(`Failed to load manifest: ${error.message}`);
        }
    }

    validate(manifest) {
        const required = ['applicationCode', 'applicationName', 'frontendUrl', 'backendUrl', 'framework', 'features'];
        for (const field of required) {
            if (!manifest[field]) {
                throw new Error(`Manifest missing required field: ${field}`);
            }
        }
        if (!Array.isArray(manifest.features)) {
            throw new Error('Manifest features must be an array');
        }
    }
}

module.exports = ManifestLoader;
