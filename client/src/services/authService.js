import api from "../api/axios";

export const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
};

export const logout = async () => {
    const response = await api.post("/auth/logout");
    return response.data;
};

export const logoutAll = async (userId) => {
    const response = await api.post("/auth/logout-all", { userId });
    return response.data;
};

export const refreshToken = async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
};
