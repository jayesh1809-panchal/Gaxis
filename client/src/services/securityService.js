import api from "../api/axios";

const getCredentials = async (applicationId) => {
    const response = await api.get(`/security/applications/${applicationId}/credentials`);
    return response.data;
};

const rotateSecret = async (applicationId, data) => {
    const response = await api.post(`/security/applications/${applicationId}/credentials/rotate`, data);
    return response.data;
};

const getPolicies = async (applicationId) => {
    const response = await api.get(`/security/applications/${applicationId}/policies`);
    return response.data;
};

const updatePolicies = async (applicationId, data) => {
    const response = await api.put(`/security/applications/${applicationId}/policies`, data);
    return response.data;
};

const getSessions = async (applicationId) => {
    const response = await api.get(`/security/applications/${applicationId}/sessions`);
    return response.data;
};

const revokeSession = async (applicationId, sessionId) => {
    const response = await api.delete(`/security/applications/${applicationId}/sessions/${sessionId}`);
    return response.data;
};

export default {
    getCredentials,
    rotateSecret,
    getPolicies,
    updatePolicies,
    getSessions,
    revokeSession
};
