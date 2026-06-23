const pkg = require('../../package.json');

/**
 * Version Manager
 * Tracks current SDK version and enables future compatibility checks.
 */
class VersionManager {
  static getVersion() {
    return pkg.version;
  }
  static getUserAgent() {
    return `gaxis-sdk-node/${pkg.version}`;
  }
  static isCompatible(minimumVersion) {
    // Basic semantic versioning check (simplified for foundation)
    const current = this.getVersion().split('.').map(Number);
    const required = minimumVersion.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (current[i] > required[i]) return true;
      if (current[i] < required[i]) return false;
    }
    return true; // Exactly equal
  }
}
module.exports = VersionManager;