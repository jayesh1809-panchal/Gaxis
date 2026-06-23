import api from "../api/axios";

const getAuditLogs = async (params = {}) => {
    // Example params: page, limit, search, category, action, resourceType, startDate, endDate
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/audit-logs${queryString ? `?${queryString}` : ""}`);
    return response.data;
};

const getAuditLogById = async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
};

export default {
    getAuditLogs,
    getAuditLogById,
};
