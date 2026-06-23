import api from "../api/axios";

export const getMarketplaceApplications = async () => {
    return api.get("/marketplace/applications");
};

export const getMarketplaceApplicationDetails = async (id) => {
    return api.get(`/marketplace/applications/${id}`);
};

export const installApplication = async (id, data) => {
    return api.post(`/marketplace/applications/${id}/install`, data);
};

export const uninstallApplication = async (id) => {
    return api.post(`/marketplace/applications/${id}/uninstall`);
};

export const getInstalledApplications = async () => {
    return api.get("/marketplace/installations");
};

export default {
    getMarketplaceApplications,
    getMarketplaceApplicationDetails,
    installApplication,
    uninstallApplication,
    getInstalledApplications
};
