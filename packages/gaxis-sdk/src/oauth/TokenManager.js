const axios = require('axios');
const { jwtVerify } = require('jose');
const { AuthenticationError, NetworkError } = require('../utils/errors');

/**
 * Token Manager
 * Handles token exchange, validation, and lifecycle.
 */
class TokenManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    /**
     * Exchanges an Authorization Code for Tokens
     * @param {string} code 
     * @param {string} codeVerifier 
     * @returns {Promise<Object>} Token response
     */
    async exchangeCode(code, codeVerifier) {
        try {
            const oidcConfig = await this.sdk.oauth.discovery.getConfig();
            const tokenEndpoint = oidcConfig.token_endpoint;

            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', this.sdk.config.clientId);
            params.append('client_secret', this.sdk.config.clientSecret);
            params.append('redirect_uri', this.sdk.config.redirectUri);
            params.append('code', code);
            params.append('code_verifier', codeVerifier);

            this.sdk.logger.debug(`Exchanging code for token at ${tokenEndpoint}`);
            
            const response = await axios.post(tokenEndpoint, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const tokenData = response.data;
            
            // Validate ID Token signature using JWKS
            if (tokenData.id_token) {
                await this.validateIdToken(tokenData.id_token);
            }

            this.sdk.events.emitEvent(this.sdk.events.events.AUTH_SUCCESS, { tokenData });
            return tokenData;
        } catch (error) {
            this.sdk.logger.error(`Token exchange failed: ${error.message}`);
            this.sdk.events.emitEvent(this.sdk.events.events.AUTH_FAILURE, { error: error.message });
            throw new AuthenticationError('Failed to exchange authorization code for tokens', { originalError: error });
        }
    }

    /**
     * Validates the ID token signature against the remote JWKS.
     * @param {string} idToken 
     * @returns {Promise<Object>} decoded payload
     */
    async validateIdToken(idToken) {
        try {
            const jwks = await this.sdk.oauth.discovery.getJWKS();
            // jwtVerify automatically fetches the key matching the 'kid' header
            const { payload, protectedHeader } = await jwtVerify(idToken, jwks, {
                issuer: this.sdk.config.baseUrl,
                audience: this.sdk.config.clientId,
            });

            this.sdk.logger.debug(`ID Token signature verified successfully for sub: ${payload.sub}`);
            return payload;
        } catch (error) {
            this.sdk.logger.error(`ID Token validation failed: ${error.message}`);
            throw new AuthenticationError('Invalid ID Token signature or claims', { originalError: error });
        }
    }

    /**
     * Uses a refresh token to get a new access token.
     * @param {string} refreshToken 
     * @returns {Promise<Object>}
     */
    async refreshAccessToken(refreshToken) {
        try {
            const oidcConfig = await this.sdk.oauth.discovery.getConfig();
            
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('client_id', this.sdk.config.clientId);
            params.append('client_secret', this.sdk.config.clientSecret);
            params.append('refresh_token', refreshToken);

            const response = await axios.post(oidcConfig.token_endpoint, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            this.sdk.events.emitEvent(this.sdk.events.events.TOKEN_REFRESHED);
            return response.data;
        } catch (error) {
            throw new AuthenticationError('Failed to refresh token', { originalError: error });
        }
    }

    /**
     * Logs out the user via the IdP end_session_endpoint if available.
     * @param {string} idTokenHint 
     * @param {string} postLogoutRedirectUri 
     * @returns {Promise<string>} The logout URL to redirect to
     */
    async getLogoutUrl(idTokenHint = null, postLogoutRedirectUri = null) {
        const oidcConfig = await this.sdk.oauth.discovery.getConfig();
        
        if (!oidcConfig.end_session_endpoint) {
            this.sdk.logger.warn("No end_session_endpoint found in OIDC configuration.");
            return null;
        }

        const url = new URL(oidcConfig.end_session_endpoint);
        if (idTokenHint) url.searchParams.append('id_token_hint', idTokenHint);
        if (postLogoutRedirectUri) url.searchParams.append('post_logout_redirect_uri', postLogoutRedirectUri);
        
        return url.toString();
    }
}

module.exports = TokenManager;
