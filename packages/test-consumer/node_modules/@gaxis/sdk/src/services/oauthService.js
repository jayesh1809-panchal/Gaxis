const axios = require('axios');

class OAuthService {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
        this.api = axios.create({ baseURL: this.baseUrl });
    }

    /**
     * Generate the Authorize URL to redirect users to G-Axis
     * @param {string} state 
     * @param {string} codeChallenge 
     * @param {string} scope 
     * @returns {string}
     */
    getAuthorizeUrl(state, codeChallenge, scope = 'openid profile email roles permissions') {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: scope,
            state: state
        });

        if (codeChallenge) {
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');
        }

        return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchange Authorization Code for Access and Refresh Tokens
     * @param {string} code 
     * @param {string} codeVerifier 
     * @returns {Promise<Object>}
     */
    async exchangeCode(code, codeVerifier) {
        try {
            const response = await this.api.post('/oauth/token', {
                grant_type: 'authorization_code',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                code,
                code_verifier: codeVerifier
            });
            return response.data;
        } catch (error) {
            throw new Error(`Token exchange failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Refresh Access Token using Refresh Token
     * @param {string} refreshToken 
     * @returns {Promise<Object>}
     */
    async refreshToken(refreshToken) {
        try {
            const response = await this.api.post('/oauth/token', {
                grant_type: 'refresh_token',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken
            });
            return response.data;
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

module.exports = OAuthService;
