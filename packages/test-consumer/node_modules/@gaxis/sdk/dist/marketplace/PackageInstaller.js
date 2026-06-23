/**
 * Package Installer
 * Coordinates dependency resolution and delegates to the Integration Engine.
 */
class PackageInstaller {
  constructor(sdkInstance, registry, dependencyResolver) {
    this.sdk = sdkInstance;
    this.registry = registry;
    this.dependencyResolver = dependencyResolver;
  }
  async install(packageName) {
    this.sdk.logger.info(`Attempting to install package: ${packageName}`);

    // 1. Fetch from registry
    const pkg = await this.registry.get(packageName);
    if (!pkg) {
      throw new Error(`Install Failed: Package '${packageName}' not found in registry.`);
    }

    // 2. Resolve dependencies recursively (simulated shallowly for now)
    await this.dependencyResolver.resolve(pkg);

    // 3. Hand over to Integration Engine to provision ecosystem entities
    // (Assuming the package manifest aligns closely enough with integration requirements)
    try {
      // Map gaxis-package.json 'name' to 'applicationCode' expected by integration engine
      const integrationManifest = {
        ...pkg,
        applicationCode: pkg.name,
        applicationName: pkg.name
      };

      // We can't generate files dynamically in a generalized install without knowing the target FS, 
      // but we can register the application via the integration pipeline.
      const {
        application,
        clientSecret
      } = await this.sdk.application.registerApplication(integrationManifest);

      // Update analytics
      pkg.installCount = (pkg.installCount || 0) + 1;
      await this.registry.save(pkg);
      this.sdk.logger.info(`Successfully installed package: ${packageName}`);
      this.sdk.events.emitEvent('package:installed', {
        packageName
      });
      return application;
    } catch (error) {
      this.sdk.logger.error(`Install Failed for ${packageName}: ${error.message}`);
      this.sdk.events.emitEvent('package:failed', {
        packageName,
        error: error.message
      });
      throw error;
    }
  }
}
module.exports = PackageInstaller;