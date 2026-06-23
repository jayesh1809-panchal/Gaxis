/**
 * Permission Mapper
 * Maps central G-Axis permission URIs/Strings to local application permissions dynamically.
 */
class PermissionMapper {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.mappingConfig = this.sdk.config.permissionMapping || {};
  }

  /**
   * Maps a list of incoming G-Axis permissions to their local equivalents.
   * @param {string[]} gaxisPermissions 
   * @returns {string[]}
   */
  mapPermissions(gaxisPermissions = []) {
    if (!Array.isArray(gaxisPermissions)) return [];
    const mappedPermissions = new Set();
    gaxisPermissions.forEach(gPerm => {
      if (this.mappingConfig[gPerm]) {
        mappedPermissions.add(this.mappingConfig[gPerm]);
      } else {
        // Passthrough if not mapped
        mappedPermissions.add(gPerm);
      }
    });
    return Array.from(mappedPermissions);
  }
}
module.exports = PermissionMapper;