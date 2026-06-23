import api from "../api/axios";

// User Core Methods
export const getUsers = async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
};

export const createUser = async (data) => {
    const response = await api.post("/users", data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

export const updateUserStatus = async (id, status) => {
    const response = await api.put(`/users/${id}/status`, { status });
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

// User Application Access Methods
export const getUserApplications = async (userId) => {
    const response = await api.get(`/users/${userId}/applications`);
    return response.data;
};

export const assignApplication = async (userId, applicationId) => {
    const response = await api.post(`/users/${userId}/applications`, { applicationId });
    return response.data;
};

export const updateApplicationAccess = async (userId, appId, status) => {
    const response = await api.put(`/users/${userId}/applications/${appId}`, { status });
    return response.data;
};

export const removeApplicationAccess = async (userId, appId) => {
    const response = await api.delete(`/users/${userId}/applications/${appId}`);
    return response.data;
};
