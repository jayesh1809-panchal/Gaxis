import axios from 'axios';

export const sessionService = {
    trackActivity: async (baseUrl, sessionId) => {
        try {
            // In a real implementation this might hit a specific ping endpoint
            // or just be a side-effect of normal API calls if an interceptor is used.
            await axios.post(`${baseUrl}/session/ping`, {}, {
                headers: { 'x-session-id': sessionId }
            });
        } catch (error) {
            // Silent failure, might mean session expired or network error
        }
    }
};
