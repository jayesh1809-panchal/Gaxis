const crypto = require('crypto');

/**
 * PKCE Manager
 * Handles secure generation of State, Nonce, and Code Challenges (S256).
 */
class PKCEManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }
  _generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generates a state token and stores it temporarily.
   * @param {string} sessionId 
   * @returns {Promise<string>}
   */
  async generateState(sessionId) {
    const state = this._generateRandomString();
    await this.sdk.storage.set(`oauth_state_${state}`, sessionId, 600); // 10 mins TTL
    return state;
  }

  /**
   * Generates a nonce to prevent replay attacks.
   * @param {string} state 
   * @returns {Promise<string>}
   */
  async generateNonce(state) {
    const nonce = this._generateRandomString();
    await this.sdk.storage.set(`oauth_nonce_${state}`, nonce, 600);
    return nonce;
  }

  /**
   * Generates a PKCE Code Verifier and S256 Challenge.
   * @param {string} state 
   * @returns {Promise<{codeVerifier: string, codeChallenge: string}>}
   */
  async generatePKCE(state) {
    const codeVerifier = this._generateRandomString(43); // RFC 7636 req length >= 43
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    await this.sdk.storage.set(`oauth_verifier_${state}`, codeVerifier, 600);
    return {
      codeVerifier,
      codeChallenge
    };
  }

  /**
   * Retrieves and optionally removes the code verifier.
   */
  async verifyAndConsume(state, expectedNonce = null) {
    const codeVerifier = await this.sdk.storage.get(`oauth_verifier_${state}`);
    const storedNonce = await this.sdk.storage.get(`oauth_nonce_${state}`);
    if (!codeVerifier) {
      throw new Error("Invalid or expired state for PKCE flow");
    }
    if (expectedNonce && expectedNonce !== storedNonce) {
      throw new Error("Nonce validation failed");
    }

    // Cleanup
    await this.sdk.storage.delete(`oauth_state_${state}`);
    await this.sdk.storage.delete(`oauth_verifier_${state}`);
    await this.sdk.storage.delete(`oauth_nonce_${state}`);
    return codeVerifier;
  }
}
module.exports = PKCEManager;