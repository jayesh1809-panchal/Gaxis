const axios = require('axios');
const {
  createRemoteJWKSet
} = require('jose');
const {
  NetworkError
} = require('../utils/errors');

/**
 * OIDC Discovery Manager
 * Fetches OpenID configuration and JWKS dynamically without hardcoded URLs.
 */
class DiscoveryManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.baseUrl = this.sdk.config.baseUrl;
    this.configCache = null;
    this.jwksCache = null;
  }

  /**
   * Fetches and caches the OpenID configuration.
   */
  async getConfig() {
    if (this.configCache) {
      return this.configCache;
    }
    const discoveryUrl = `${this.baseUrl}/.well-known/openid-configuration`;
    try {
      this.sdk.logger.debug(`Fetching OIDC Discovery document from: ${discoveryUrl}`);
      const response = await axios.get(discoveryUrl);
      this.configCache = response.data;
      this.sdk.logger.info(`OIDC Discovery document loaded successfully.`);
      return this.configCache;
    } catch (error) {
      this.sdk.logger.error(`Failed to fetch OIDC Discovery document: ${error.message}`);
      throw new NetworkError('Failed to fetch OpenID Configuration', {
        originalError: error
      });
    }
  }

  /**
   * Fetches and caches the remote JWKS using the jose library.
   */
  async getJWKS() {
    if (this.jwksCache) {
      return this.jwksCache;
    }
    const config = await this.getConfig();
    if (!config.jwks_uri) {
      throw new NetworkError('OIDC configuration missing jwks_uri');
    }
    try {
      this.sdk.logger.debug(`Fetching JWKS from: ${config.jwks_uri}`);
      this.jwksCache = createRemoteJWKSet(new URL(config.jwks_uri));
      this.sdk.logger.info(`JWKS loaded successfully.`);
      return this.jwksCache;
    } catch (error) {
      this.sdk.logger.error(`Failed to load JWKS: ${error.message}`);
      throw new NetworkError('Failed to fetch JWKS', {
        originalError: error
      });
    }
  }
}
module.exports = DiscoveryManager;