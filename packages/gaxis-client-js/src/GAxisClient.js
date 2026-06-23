import axios from 'axios';
import { StorageManager } from './storage.js';
import { TokenManager } from './tokenManager.js';
import { SessionManager } from './session.js';
import { OAuthUtils } from './oauth.js';
import { KEYS } from './constants.js';

export class GAxisClient {
    constructor(config) {
        if (!config.clientId) throw new Error('clientId is required');
        if (!config.baseUrl) throw new Error('baseUrl is required');
        if (!config.redirectUri) throw new Error('redirectUri is required');

        this.config = {
            clientId: config.clientId,
            baseUrl: config.baseUrl.replace(/\/$/, ''),
            redirectUri: config.redirectUri,
            scopes: config.scopes || ['openid', 'profile', 'email']
        };

        this.storage = new StorageManager();
        this.tokens = new TokenManager(this.storage);
        this.session = new SessionManager(this.storage);
        this.oauth = new OAuthUtils(this.storage);

        this.api = axios.create({
            baseURL: `${this.config.baseUrl}/api`,
            withCredentials: true
        });

        this.api.interceptors.request.use((config) => {
            const token = this.tokens.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const newTokens = await this.refreshSession();
                        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
                        return this.api(originalRequest);
                    } catch (e) {
                        this.clearState();
                        window.location.href = this.config.redirectUri;
                        return Promise.reject(e);
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`OAuth Error: ${error}`);
        }

        if (code && state) {
            const savedState = this.storage.get(KEYS.STATE);
            if (state !== savedState) {
                throw new Error('State mismatch. Possible CSRF attack.');
            }

            const codeVerifier = this.storage.get(KEYS.CODE_VERIFIER);
            await this.exchangeCodeForTokens(code, codeVerifier);
            await this.fetchUserInfo();
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return { success: true, isAuthenticated: true };
        }

        return { success: true, isAuthenticated: this.isAuthenticated() };
    }

    async login() {
        const queryParams = await this.oauth.createAuthRequest({
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scopes: this.config.scopes
        });

        window.location.href = `${this.config.baseUrl}/api/oauth/authorize?${queryParams}`;
    }

    async exchangeCodeForTokens(code, codeVerifier) {
        try {
            console.log("TOKEN EXCHANGE START");
            console.log("CODE:", code);

            const response = await axios.post(`${this.config.baseUrl}/api/oauth/token`, {
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                redirect_uri: this.config.redirectUri,
                code,
                code_verifier: codeVerifier
            });

            console.log("TOKEN RESPONSE:", response.data);

            this.tokens.setTokens(response.data);
            
            // Clear OAuth state
            this.storage.remove(KEYS.STATE);
            this.storage.remove(KEYS.NONCE);
            this.storage.remove(KEYS.CODE_VERIFIER);

            return response.data;
        } catch (error) {
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    async fetchUserInfo() {
        try {
            const response = await this.api.get('/oauth/userinfo');
            this.session.setSessionData(response.data);
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch user info');
        }
    }

    async refreshSession() {
        const refreshToken = this.tokens.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        try {
            const response = await axios.post(`${this.config.baseUrl}/api/oauth/token`, {
                grant_type: 'refresh_token',
                client_id: this.config.clientId,
                refresh_token: refreshToken
            });

            this.tokens.setTokens(response.data);
            return response.data;
        } catch (error) {
            this.clearState();
            throw new Error('Session refresh failed');
        }
    }

    async logout() {
        try {
            const token = this.tokens.getAccessToken();
            if (token) {
                await this.api.post('/oauth/revoke', { token });
            }
        } catch (e) {
            console.error('Revocation failed', e);
        } finally {
            this.clearState();
            window.location.href = this.config.redirectUri;
        }
    }

    async logoutAll() {
        try {
            await this.api.post('/auth/logout-all');
        } catch (e) {
            console.error('Logout all failed', e);
        } finally {
            this.clearState();
            window.location.href = this.config.redirectUri;
        }
    }

    clearState() {
        this.tokens.clearTokens();
        this.session.clearSession();
    }

    isAuthenticated() {
        return this.tokens.isAuthenticated();
    }

    getUser() {
        return this.session.getUser();
    }

    getPermissions() {
        return this.session.getPermissions();
    }

    getRoles() {
        return this.session.getRoles();
    }
}
