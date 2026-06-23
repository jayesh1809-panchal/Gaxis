import api from "../api/axios";

export const getRolePermissions = async (roleId) => {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data;
};

export const assignPermissions = async (roleId, permissionIds) => {
    const response = await api.post(`/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
};

export const removePermission = async (roleId, permissionId) => {
    const response = await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
};
