const PackageRegistry = require('./PackageRegistry');
const VersionManager = require('./VersionManager');
const DependencyResolver = require('./DependencyResolver');
const PackageValidator = require('./PackageValidator');
const PackagePublisher = require('./PackagePublisher');
const PackageInstaller = require('./PackageInstaller');
const UpgradeManager = require('./UpgradeManager');
const UninstallManager = require('./UninstallManager');

/**
 * Marketplace Engine (Facade)
 * Central distribution mechanism for the entire G-Axis ecosystem.
 */
class MarketplaceEngine {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.registry = new PackageRegistry(this.sdk);
    this.versionManager = new VersionManager(this.sdk);
    this.validator = new PackageValidator(this.sdk);
    this.dependencyResolver = new DependencyResolver(this.sdk, this.registry, this.versionManager);
    this.publisher = new PackagePublisher(this.sdk, this.registry, this.validator, this.versionManager);
    this.installer = new PackageInstaller(this.sdk, this.registry, this.dependencyResolver);
    this.upgradeManager = new UpgradeManager(this.sdk, this.installer);
    this.uninstallManager = new UninstallManager(this.sdk);
  }
  async publish(manifestPath) {
    return this.publisher.publish(manifestPath);
  }
  async install(packageName) {
    return this.installer.install(packageName);
  }
  async upgrade(packageName) {
    return this.upgradeManager.upgrade(packageName);
  }
  async uninstall(packageName) {
    return this.uninstallManager.remove(packageName);
  }
  async search(query = {}) {
    const all = await this.registry.getAll();
    return all.filter(pkg => {
      let match = true;
      if (query.type && pkg.type !== query.type) match = false;
      if (query.publisher && pkg.publisher !== query.publisher) match = false;
      if (query.feature && (!pkg.features || !pkg.features.includes(query.feature))) match = false;
      return match;
    });
  }
  async validate(manifestPath) {
    // Mock wrapper around internal validator if external tool needs to pre-flight check a manifest.
    return true;
  }
}
module.exports = MarketplaceEngine;