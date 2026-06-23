import api from "../api/axios";

export const getUserRoles = async (userId) => {
    const response = await api.get(`/users/${userId}/roles`);
    return response.data;
};

export const assignRoles = async (userId, roleIds) => {
    const response = await api.post(`/users/${userId}/roles`, { roleIds });
    return response.data;
};

export const removeRole = async (userId, roleId) => {
    const response = await api.delete(`/users/${userId}/roles/${roleId}`);
    return response.data;
};
