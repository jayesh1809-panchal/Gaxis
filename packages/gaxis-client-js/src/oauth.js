import { KEYS } from './constants.js';

export class OAuthUtils {
    constructor(storage) {
        this.storage = storage;
    }

    generateRandomString(length = 64) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    }

    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        
        return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async createAuthRequest({ clientId, redirectUri, scopes }) {
        const state = this.generateRandomString(32);
        const nonce = this.generateRandomString(32);
        const codeVerifier = this.generateRandomString(64);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        this.storage.set(KEYS.STATE, state);
        this.storage.set(KEYS.NONCE, nonce);
        this.storage.set(KEYS.CODE_VERIFIER, codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes.join(' '),
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        return params.toString();
    }
}
