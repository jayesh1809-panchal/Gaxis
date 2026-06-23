import api from "../api/axios";

export const aiService = {
    sendMessage: async (text, conversationId = null) => {
        const response = await api.post("/ai/query", { text, conversationId });
        return response.data;
    },

    executeAction: async (actionId) => {
        const response = await api.post(`/ai/actions/${actionId}/execute`);
        return response.data;
    },

    getConversations: async () => {
        const response = await api.get("/ai/conversations");
        return response.data;
    },

    getConversationById: async (id) => {
        const response = await api.get(`/ai/conversations/${id}`);
        return response.data;
    },

    getExecutionLogs: async () => {
        const response = await api.get("/ai/logs");
        return response.data;
    }
};

export default aiService;
