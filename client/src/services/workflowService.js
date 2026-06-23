import api from "../api/axios";

export const getWorkflows = async () => {
    return api.get("/workflows");
};

export const getWorkflowById = async (id) => {
    return api.get(`/workflows/${id}`);
};

export const createWorkflow = async (workflowData) => {
    return api.post("/workflows", workflowData);
};

export const updateWorkflow = async (id, workflowData) => {
    return api.put(`/workflows/${id}`, workflowData);
};

export const deleteWorkflow = async (id) => {
    return api.delete(`/workflows/${id}`);
};

export const getExecutions = async (workflowId = null) => {
    const query = workflowId ? `?workflowId=${workflowId}` : "";
    return api.get(`/workflows/executions${query}`);
};

export const getExecutionById = async (id) => {
    return api.get(`/workflows/executions/${id}`);
};

export default {
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getExecutions,
    getExecutionById
};
