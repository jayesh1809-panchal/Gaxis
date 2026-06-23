const axios = require('axios');
class UserService {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.api = axios.create({
      baseURL: this.baseUrl
    });
  }

  /**
   * Fetch the user's profile from G-Axis using their access token
   * @param {string} accessToken 
   * @returns {Promise<Object>}
   */
  async getUserInfo(accessToken) {
    try {
      const response = await this.api.get('/oauth/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user info: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Handles SDK provisioning logic (synchronize G-Axis user with Local DB)
   * Developers will pass a `syncUserHook` function to process local saving.
   * @param {Object} gaxisProfile 
   * @param {Function} syncUserHook 
   */
  async provisionUser(gaxisProfile, syncUserHook) {
    if (typeof syncUserHook !== 'function') {
      return gaxisProfile;
    }
    return await syncUserHook(gaxisProfile);
  }
}
module.exports = UserService;