import api from "../api/axios";

export const getPermissions = async (params = {}) => {
    const response = await api.get("/permissions", { params });
    return response.data;
};

export const createPermission = async (data) => {
    const response = await api.post("/permissions", data);
    return response.data;
};

export const updatePermission = async (id, data) => {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data;
};

export const updatePermissionStatus = async (id, status) => {
    const response = await api.put(`/permissions/${id}/status`, { status });
    return response.data;
};

export const deletePermission = async (id) => {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
};
