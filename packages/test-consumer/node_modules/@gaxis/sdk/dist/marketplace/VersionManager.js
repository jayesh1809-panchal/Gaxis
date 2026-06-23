/**
 * Version Manager
 * Implements Semantic Versioning logic for the marketplace.
 */
class VersionManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }

  /**
   * Returns true if target is strictly > current.
   */
  isUpgrade(currentVersion, targetVersion) {
    const parse = v => v.split('.').map(Number);
    const [cMaj, cMin, cPat] = parse(currentVersion);
    const [tMaj, tMin, tPat] = parse(targetVersion);
    if (tMaj > cMaj) return true;
    if (tMaj === cMaj && tMin > cMin) return true;
    if (tMaj === cMaj && tMin === cMin && tPat > cPat) return true;
    return false;
  }

  /**
   * Returns true if target version satisfies the required constraint.
   * Currently supports exact match or generic '1.0.x' mapping.
   */
  satisfies(availableVersion, requiredVersion) {
    // Simplified semver resolution
    if (requiredVersion === '*' || requiredVersion === 'latest') return true;
    if (availableVersion === requiredVersion) return true;

    // Support basic ^1.0.0 or ~1.0.0 via naive prefix matching for this iteration
    if (requiredVersion.startsWith('^') || requiredVersion.startsWith('~')) {
      const baseReq = requiredVersion.substring(1).split('.')[0];
      const baseAvail = availableVersion.split('.')[0];
      return baseReq === baseAvail;
    }
    return false;
  }
}
module.exports = VersionManager;