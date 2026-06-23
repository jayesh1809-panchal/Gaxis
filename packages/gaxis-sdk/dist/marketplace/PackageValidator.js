/**
 * Package Validator
 * Enforces structural integrity of the gaxis-package.json manifest.
 */
class PackageValidator {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }
  validate(manifest) {
    const required = ['name', 'version', 'type', 'features'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Invalid Package: Missing required field '${field}'`);
      }
    }
    const validTypes = ['application', 'plugin', 'connector', 'widget', 'automation', 'theme', 'integration'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`Invalid Package: Unknown type '${manifest.type}'`);
    }
    if (typeof manifest.version !== 'string' || manifest.version.split('.').length !== 3) {
      throw new Error(`Invalid Package: Version must be standard semver (x.y.z)`);
    }
    return true;
  }
}
module.exports = PackageValidator;