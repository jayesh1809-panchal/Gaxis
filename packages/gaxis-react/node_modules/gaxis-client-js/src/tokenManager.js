import { KEYS } from './constants.js';

export class TokenManager {
    constructor(storage) {
        this.storage = storage;
    }

    setTokens({ access_token, id_token, refresh_token }) {
        if (access_token) this.storage.set(KEYS.ACCESS_TOKEN, access_token);
        if (id_token) this.storage.set(KEYS.ID_TOKEN, id_token);
        if (refresh_token) this.storage.set(KEYS.REFRESH_TOKEN, refresh_token);
    }

    getAccessToken() {
        return this.storage.get(KEYS.ACCESS_TOKEN);
    }

    getIdToken() {
        return this.storage.get(KEYS.ID_TOKEN);
    }

    getRefreshToken() {
        return this.storage.get(KEYS.REFRESH_TOKEN);
    }

    clearTokens() {
        this.storage.remove(KEYS.ACCESS_TOKEN);
        this.storage.remove(KEYS.ID_TOKEN);
        this.storage.remove(KEYS.REFRESH_TOKEN);
    }
    
    isAuthenticated() {
        return !!this.getAccessToken();
    }
}
