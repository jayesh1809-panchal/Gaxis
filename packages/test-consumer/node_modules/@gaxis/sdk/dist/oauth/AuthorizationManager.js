/**
 * Authorization Manager
 * Constructs the OAuth2/OIDC Authorization URL.
 */
class AuthorizationManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }

  /**
   * Initiates the login process by generating the redirect URL.
   * @param {string} sessionId - Identifier for the initiating user/session
   * @returns {Promise<string>}
   */
  async getLoginUrl(sessionId = 'default') {
    try {
      // 1. Get endpoints via Discovery
      const oidcConfig = await this.sdk.oauth.discovery.getConfig();
      const authEndpoint = oidcConfig.authorization_endpoint;

      // 2. Generate PKCE & Security Tokens
      const state = await this.sdk.oauth.pkce.generateState(sessionId);
      const nonce = await this.sdk.oauth.pkce.generateNonce(state);
      const {
        codeChallenge
      } = await this.sdk.oauth.pkce.generatePKCE(state);

      // 3. Construct URL
      const url = new URL(authEndpoint);
      url.searchParams.append('client_id', this.sdk.config.clientId);
      url.searchParams.append('redirect_uri', this.sdk.config.redirectUri);
      url.searchParams.append('response_type', 'code');
      url.searchParams.append('scope', 'openid profile email'); // Base scopes
      url.searchParams.append('state', state);
      url.searchParams.append('nonce', nonce);
      url.searchParams.append('code_challenge', codeChallenge);
      url.searchParams.append('code_challenge_method', 'S256');
      this.sdk.logger.debug(`Generated Login URL with State: ${state}`);
      return url.toString();
    } catch (error) {
      this.sdk.logger.error(`Failed to construct login URL: ${error.message}`);
      throw error;
    }
  }
}
module.exports = AuthorizationManager;