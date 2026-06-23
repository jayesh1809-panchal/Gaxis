import api from "../api/axios";

export const getProvisioningRule = async (applicationId) => {
    const response = await api.get(`/provision/rules/${applicationId}`);
    return response.data;
};

export const updateProvisioningRule = async (applicationId, data) => {
    const response = await api.put(`/provision/rules/${applicationId}`, data);
    return response.data;
};
