const axios = require('axios');
class RoleService {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.api = axios.create({
      baseURL: this.baseUrl
    });
  }

  /**
   * Download roles mapped to this application from G-Axis
   * @returns {Promise<Array>}
   */
  async syncRoles() {
    try {
      // App uses client credentials to fetch app-specific data
      const response = await this.api.post('/api/sdk/sync/roles', {
        client_id: this.clientId,
        client_secret: this.clientSecret
      });
      return response.data.roles;
    } catch (error) {
      console.error("Role sync failed:", error.message);
      return [];
    }
  }

  /**
   * Developers map G-Axis roles to local roles.
   * @param {Array} gaxisRoles 
   * @param {Function} syncRoleHook 
   */
  async provisionRoles(gaxisRoles, syncRoleHook) {
    if (typeof syncRoleHook !== 'function') {
      return gaxisRoles;
    }
    return await syncRoleHook(gaxisRoles);
  }
}
module.exports = RoleService;