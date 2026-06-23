import api from "../api/axios";

export const setupMfa = async () => {
    const response = await api.post("/mfa/setup");
    return response.data;
};

export const verifySetup = async (token) => {
    const response = await api.post("/mfa/verify-setup", { token });
    return response.data;
};

export const disableMfa = async (token) => {
    const response = await api.post("/mfa/disable", { token });
    return response.data;
};

export const regenerateBackupCodes = async (token) => {
    const response = await api.post("/mfa/backup-codes", { token });
    return response.data;
};

export const verifyMfa = async (preAuthToken, token) => {
    // This goes to the auth route since it issues actual JWTs
    const response = await api.post("/auth/verify-mfa", { preAuthToken, token });
    return response.data;
};
