/**
 * Dependency Resolver
 * Scans the dependencies block of a manifest and guarantees they exist.
 */
class DependencyResolver {
    constructor(sdkInstance, registry, versionManager) {
        this.sdk = sdkInstance;
        this.registry = registry;
        this.versionManager = versionManager;
    }

    async resolve(manifest) {
        const deps = manifest.dependencies || {};
        this.sdk.logger.info(`Resolving dependencies for ${manifest.name}...`);

        for (const [depName, depVersion] of Object.entries(deps)) {
            const pkg = await this.registry.get(depName);
            if (!pkg) {
                throw new Error(`Missing Dependency: ${manifest.name} requires ${depName}@${depVersion}, but it is not published in the registry.`);
            }
            
            if (!this.versionManager.satisfies(pkg.version, depVersion)) {
                throw new Error(`Version Conflict: ${manifest.name} requires ${depName}@${depVersion}, but registry has ${pkg.version}.`);
            }
            
            this.sdk.logger.info(`Dependency ${depName}@${pkg.version} resolved.`);
        }

        return true;
    }
}

module.exports = DependencyResolver;
