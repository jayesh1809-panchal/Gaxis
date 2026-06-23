const DiscoveryManager = require('./DiscoveryManager');
const PKCEManager = require('./PKCEManager');
const AuthorizationManager = require('./AuthorizationManager');
const TokenManager = require('./TokenManager');

/**
 * OAuth Client Engine Facade
 * Brings together Discovery, PKCE, Authorization, and Token management.
 */
class OAuthClient {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.discovery = new DiscoveryManager(this.sdk);
    this.pkce = new PKCEManager(this.sdk);
    this.authorization = new AuthorizationManager(this.sdk);
    this.token = new TokenManager(this.sdk);
  }

  /**
   * Initiates the login flow and returns the URL to redirect the user to.
   * @param {string} sessionId 
   * @returns {Promise<string>} Authorization URL
   */
  async login(sessionId = 'default') {
    return this.authorization.getLoginUrl(sessionId);
  }

  /**
   * Handles the callback from the authorization server, verifying state and exchanging code.
   * @param {string} code 
   * @param {string} state 
   * @param {string} error 
   * @returns {Promise<Object>} Token response
   */
  async handleCallback(code, state, error = null) {
    if (error) {
      throw new Error(`OAuth Callback Error: ${error}`);
    }
    if (!code || !state) {
      throw new Error("Missing code or state in callback");
    }

    // 1. Validate PKCE State and retrieve verifier
    const codeVerifier = await this.pkce.verifyAndConsume(state);

    // 2. Exchange code for tokens
    const tokenData = await this.token.exchangeCode(code, codeVerifier);
    return tokenData;
  }

  /**
   * Refreshes the access token.
   * @param {string} refreshToken 
   */
  async refreshAccessToken(refreshToken) {
    return this.token.refreshAccessToken(refreshToken);
  }

  /**
   * Constructs the logout URL for Single Logout (SLO).
   * @param {string} idTokenHint 
   * @param {string} postLogoutRedirectUri 
   */
  async logout(idTokenHint = null, postLogoutRedirectUri = null) {
    return this.token.getLogoutUrl(idTokenHint, postLogoutRedirectUri);
  }
}
module.exports = OAuthClient;