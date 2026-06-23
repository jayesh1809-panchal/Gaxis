import api from "../api/axios";

export const getEvents = async () => {
    return api.get("/event-bus/events");
};

export const getSubscriptions = async () => {
    return api.get("/event-bus/subscriptions");
};

export const createSubscription = async (data) => {
    return api.post("/event-bus/subscriptions", data);
};

export const deleteSubscription = async (id) => {
    return api.delete(`/event-bus/subscriptions/${id}`);
};

export const getDeliveries = async () => {
    return api.get("/event-bus/deliveries");
};

export const getDeadLetters = async () => {
    return api.get("/event-bus/dlq");
};

export const replayDeadLetter = async (id) => {
    return api.post(`/event-bus/dlq/${id}/replay`);
};

export default {
    getEvents,
    getSubscriptions,
    createSubscription,
    deleteSubscription,
    getDeliveries,
    getDeadLetters,
    replayDeadLetter
};
