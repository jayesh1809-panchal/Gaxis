import api from "../api/axios";

export const getSnapshot = async (global = false) => {
    return api.get(`/analytics/snapshot?global=${global}`);
};

export const getMetrics = async (window = 'daily', days = 30, global = false) => {
    return api.get(`/analytics/metrics?window=${window}&days=${days}&global=${global}`);
};

export const getRecentEvents = async () => {
    return api.get(`/analytics/events`);
};

export const exportReport = async () => {
    return api.get(`/analytics/export`, { responseType: 'blob' });
};

export default {
    getSnapshot,
    getMetrics,
    getRecentEvents,
    exportReport
};
