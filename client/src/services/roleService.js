import api from "../api/axios";

export const getRoles = async (params = {}) => {
    const response = await api.get("/roles", { params });
    return response.data;
};

export const createRole = async (data) => {
    const response = await api.post("/roles", data);
    return response.data;
};

export const updateRole = async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
};

export const updateRoleStatus = async (id, status) => {
    const response = await api.put(`/roles/${id}/status`, { status });
    return response.data;
};

export const deleteRole = async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
};
