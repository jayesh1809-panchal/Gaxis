import axios from 'axios';
export const authService = {
  login: (baseUrl, loginUrl) => {
    // Redirect to G-Axis or local proxy endpoint for OAuth
    window.location.href = loginUrl || `${baseUrl}/auth/login`;
  },
  logout: async (baseUrl, sessionId) => {
    try {
      await axios.post(`${baseUrl}/auth/logout`, {}, {
        headers: {
          'x-session-id': sessionId
        }
      });
    } catch (error) {
      console.error('GAxis SDK: Logout failed', error);
    }
  }
};