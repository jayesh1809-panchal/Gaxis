import api from "../api/axios";

export const getOrganizationUnits = async () => {
    return api.get("/governance/org-units");
};

export const createOrganizationUnit = async (data) => {
    return api.post("/governance/org-units", data);
};

export const updateOrganizationUnit = async (id, data) => {
    return api.put(`/governance/org-units/${id}`, data);
};

export const deleteOrganizationUnit = async (id) => {
    return api.delete(`/governance/org-units/${id}`);
};

export const getPolicies = async () => {
    return api.get("/governance/policies");
};

export const createPolicy = async (data) => {
    return api.post("/governance/policies", data);
};

export const updatePolicy = async (id, data) => {
    return api.put(`/governance/policies/${id}`, data);
};

export const deletePolicy = async (id) => {
    return api.delete(`/governance/policies/${id}`);
};

export const getApprovalWorkflows = async () => {
    return api.get("/governance/workflows");
};

export const createApprovalWorkflow = async (data) => {
    return api.post("/governance/workflows", data);
};

export const updateApprovalWorkflow = async (id, data) => {
    return api.put(`/governance/workflows/${id}`, data);
};

export const deleteApprovalWorkflow = async (id) => {
    return api.delete(`/governance/workflows/${id}`);
};

export const getApprovalRequests = async (status) => {
    return api.get("/governance/requests", { params: { status } });
};

export const getApprovalRequestById = async (id) => {
    return api.get(`/governance/requests/${id}`);
};

export const reviewApprovalRequest = async (id, data) => {
    return api.post(`/governance/requests/${id}/review`, data);
};

export const getDelegatedAdmins = async () => {
    return api.get("/governance/delegated-admins");
};

export const assignDelegatedAdmin = async (data) => {
    return api.post("/governance/delegated-admins", data);
};

export const revokeDelegatedAdmin = async (id) => {
    return api.delete(`/governance/delegated-admins/${id}`);
};

export const getComplianceRecords = async () => {
    return api.get("/governance/compliance/records");
};

export const createComplianceRecord = async (data) => {
    return api.post("/governance/compliance/records", data);
};

export const reviewComplianceRecord = async (id, data) => {
    return api.put(`/governance/compliance/records/${id}/review`, data);
};

export const getComplianceMetrics = async () => {
    return api.get("/governance/compliance/metrics");
};

export default {
    getOrganizationUnits,
    createOrganizationUnit,
    updateOrganizationUnit,
    deleteOrganizationUnit,
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    getApprovalWorkflows,
    createApprovalWorkflow,
    updateApprovalWorkflow,
    deleteApprovalWorkflow,
    getApprovalRequests,
    getApprovalRequestById,
    reviewApprovalRequest,
    getDelegatedAdmins,
    assignDelegatedAdmin,
    revokeDelegatedAdmin,
    getComplianceRecords,
    createComplianceRecord,
    reviewComplianceRecord,
    getComplianceMetrics
};
