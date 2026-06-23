const EventDefinition = require("../models/EventDefinition");
const EventSubscription = require("../models/EventSubscription");
const EventDelivery = require("../models/EventDelivery");
const EventDeadLetter = require("../models/EventDeadLetter");
const eventBusService = require("../services/eventBusService");
const eventDeliveryEngine = require("../services/eventDeliveryEngine");
const auditService = require("../services/auditService");

exports.getEvents = async (req, res) => {
    try {
        const events = await EventDefinition.find({
            $or: [{ tenantId: req.tenant._id }, { tenantId: null }]
        }).sort({ category: 1, name: 1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await EventSubscription.find({ tenantId: req.tenant._id })
            .populate('applicationId', 'name client_id');
        res.status(200).json({ success: true, data: subscriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSubscription = async (req, res) => {
    try {
        const { applicationId, eventCode, endpoint, transport } = req.body;
        
        const sub = await eventBusService.subscribe(
            req.tenant._id, 
            applicationId, 
            eventCode, 
            endpoint, 
            transport
        );

        await auditService.logEvent({
            req,
            action: "SUBSCRIPTION_CREATED",
            resourceType: "EventSubscription",
            resourceId: sub._id,
            metadata: { eventCode, applicationId }
        });

        res.status(201).json({ success: true, data: sub });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSubscription = async (req, res) => {
    try {
        const sub = await EventSubscription.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });

        await auditService.logEvent({
            req,
            action: "SUBSCRIPTION_REMOVED",
            resourceType: "EventSubscription",
            resourceId: sub._id,
            metadata: { eventCode: sub.eventCode }
        });

        res.status(200).json({ success: true, message: "Subscription removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await EventDelivery.find({ tenantId: req.tenant._id })
            .populate({ path: 'subscriptionId', populate: { path: 'applicationId', select: 'name' } })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, data: deliveries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDeadLetters = async (req, res) => {
    try {
        const dlq = await EventDeadLetter.find({ tenantId: req.tenant._id })
            .populate({ path: 'subscriptionId', populate: { path: 'applicationId', select: 'name' } })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: dlq });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.replayDeadLetter = async (req, res) => {
    try {
        const delivery = await eventDeliveryEngine.replay(req.params.id);

        await auditService.logEvent({
            req,
            action: "EVENT_REPLAYED",
            resourceType: "EventDeadLetter",
            resourceId: req.params.id
        });

        res.status(200).json({ success: true, message: "Event replayed", data: delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
