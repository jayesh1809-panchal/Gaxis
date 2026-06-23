/**
 * Role Mapper
 * Maps central G-Axis role URIs/Strings to local application roles dynamically.
 */
class RoleMapper {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.mappingConfig = this.sdk.config.roleMapping || {};
  }

  /**
   * Maps a list of incoming G-Axis roles to their local equivalents.
   * If no explicit map exists, passes the role through unchanged.
   * @param {string[]} gaxisRoles 
   * @returns {string[]}
   */
  mapRoles(gaxisRoles = []) {
    if (!Array.isArray(gaxisRoles)) return [];
    const mappedRoles = new Set();
    gaxisRoles.forEach(gRole => {
      if (this.mappingConfig[gRole]) {
        mappedRoles.add(this.mappingConfig[gRole]);
      } else {
        // Passthrough if not explicitly mapped, or drop if strict mode is implemented later
        mappedRoles.add(gRole);
      }
    });
    return Array.from(mappedRoles);
  }
}
module.exports = RoleMapper;