import api from "../api/axios";

export const getPlans = async (marketplaceAppId) => {
    return api.get(`/subscriptions/plans/${marketplaceAppId}`);
};

export const getMySubscriptions = async () => {
    return api.get("/subscriptions/my-subscriptions");
};

export const subscribe = async (marketplaceAppId, planId) => {
    return api.post("/subscriptions/subscribe", { marketplaceAppId, planId });
};

export const getUsage = async (marketplaceAppId) => {
    return api.get(`/subscriptions/usage/${marketplaceAppId}`);
};

export const verifyFeature = async (marketplaceAppId, feature) => {
    return api.get(`/subscriptions/verify/${marketplaceAppId}?feature=${feature}`);
};

export default {
    getPlans,
    getMySubscriptions,
    subscribe,
    getUsage,
    verifyFeature
};
