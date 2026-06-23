const fs = require('fs/promises');
const path = require('path');

/**
 * Package Publisher
 * Handles the submission of a new package or version into the ecosystem.
 */
class PackagePublisher {
    constructor(sdkInstance, registry, validator, versionManager) {
        this.sdk = sdkInstance;
        this.registry = registry;
        this.validator = validator;
        this.versionManager = versionManager;
    }

    async publish(manifestPath) {
        this.sdk.logger.info(`Publishing package from ${manifestPath}...`);

        const resolvedPath = path.resolve(process.cwd(), manifestPath);
        const fileContent = await fs.readFile(resolvedPath, 'utf8');
        const manifest = JSON.parse(fileContent);

        // 1. Validate structure
        this.validator.validate(manifest);

        // 2. Check existing registry entry
        const existingPkg = await this.registry.get(manifest.name);
        if (existingPkg) {
            if (!this.versionManager.isUpgrade(existingPkg.version, manifest.version)) {
                throw new Error(`Publish Failed: Cannot downgrade or publish same version. Existing: ${existingPkg.version}, New: ${manifest.version}`);
            }
        }

        // 3. Attach metadata
        manifest.publishedAt = new Date().toISOString();
        manifest.publisher = manifest.publisher || 'unknown'; // Would tie into Identity Engine for real authz
        manifest.healthStatus = 'HEALTHY';
        manifest.installCount = existingPkg ? existingPkg.installCount : 0;

        // 4. Save to registry
        await this.registry.save(manifest);

        this.sdk.logger.info(`Successfully published package: ${manifest.name}@${manifest.version}`);
        this.sdk.events.emitEvent('package:published', { packageName: manifest.name, version: manifest.version });

        return manifest;
    }
}

module.exports = PackagePublisher;
