import api from "../api/axios";

// User Session Endpoints
export const getMySessions = async () => {
    const response = await api.get("/sessions");
    return response.data;
};

export const getSession = async (id) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
};

export const revokeSession = async (id) => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
};

export const revokeAllSessions = async () => {
    const response = await api.delete("/sessions/logout-all");
    return response.data;
};

// Admin Session Endpoints
export const getUserSessions = async (userId) => {
    const response = await api.get(`/users/${userId}/sessions`);
    return response.data;
};

export const revokeUserSessions = async (userId) => {
    const response = await api.delete(`/users/${userId}/sessions`);
    return response.data;
};

export const forceRevokeSession = async (sessionId) => {
    const response = await api.delete(`/sessions/force/${sessionId}`);
    return response.data;
};
