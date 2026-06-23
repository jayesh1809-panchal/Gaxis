import axios from 'axios';

export const tokenService = {
    /**
     * Refreshes the access token silently.
     */
    refresh: async (baseUrl, sessionId) => {
        try {
            const response = await axios.post(`${baseUrl}/auth/refresh`, {}, {
                headers: { 'x-session-id': sessionId },
                withCredentials: true // For refresh cookies if applicable
            });
            return response.data;
        } catch (error) {
            throw new Error('Token refresh failed');
        }
    },

    startSilentRefresh: (baseUrl, sessionId, expiresInSeconds, onRefreshSuccess, onRefreshFail) => {
        // Refresh 1 minute before expiry
        const timeoutMs = (expiresInSeconds - 60) * 1000;
        
        if (timeoutMs <= 0) {
            // Already expired or too close
            tokenService.refresh(baseUrl, sessionId).then(onRefreshSuccess).catch(onRefreshFail);
            return null;
        }

        return setTimeout(async () => {
            try {
                const data = await tokenService.refresh(baseUrl, sessionId);
                onRefreshSuccess(data);
            } catch (error) {
                onRefreshFail(error);
            }
        }, timeoutMs);
    }
};
