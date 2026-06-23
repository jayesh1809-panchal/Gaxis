const axios = require('axios');
class SessionService {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.api = axios.create({
      baseURL: this.baseUrl
    });
  }

  /**
   * Validates the session heartbeat with G-Axis to ensure the token wasn't revoked globally.
   * @param {string} accessToken 
   * @returns {Promise<boolean>}
   */
  async checkHeartbeat(accessToken) {
    try {
      const response = await this.api.post('/api/sdk/session/heartbeat', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Perform Single Logout (SLO). Notifies G-Axis that this app session is terminating,
   * which may trigger global logout if configured.
   * @param {string} accessToken 
   */
  async triggerLogout(accessToken) {
    try {
      await this.api.post('/api/sdk/session/logout', {
        client_id: this.clientId
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
module.exports = SessionService;