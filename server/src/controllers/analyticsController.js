const AnalyticsAggregate = require("../models/AnalyticsAggregate");
const UsageSnapshot = require("../models/UsageSnapshot");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const auditService = require("../services/auditService");

exports.getSnapshot = async (req, res) => {
    try {
        const query = req.user.role === 'SUPER_ADMIN' && req.query.global === 'true'
            ? { tenantId: null }
            : { tenantId: req.tenant._id };

        const snapshot = await UsageSnapshot.findOne(query).sort({ snapshotDate: -1 });
        res.status(200).json({ success: true, data: snapshot || {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMetrics = async (req, res) => {
    try {
        const { window = 'daily', days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const query = req.user.role === 'SUPER_ADMIN' && req.query.global === 'true'
            ? { tenantId: null }
            : { tenantId: req.tenant._id };

        const metrics = await AnalyticsAggregate.find({
            ...query,
            timeWindow: window,
            periodStartDate: { $gte: startDate }
        }).sort({ periodStartDate: 1 });

        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecentEvents = async (req, res) => {
    try {
        const events = await AnalyticsEvent.find({ tenantId: req.tenant._id })
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('actorId', 'name email')
            .populate('applicationId', 'name');

        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportReport = async (req, res) => {
    try {
        await auditService.logEvent({
            req,
            action: "REPORT_EXPORTED",
            resourceType: "Analytics",
            metadata: { type: 'csv' }
        });

        // Mock CSV export response
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"analytics_report.csv\"');
        res.status(200).send("EventType,Timestamp,Actor\nUSER_LOGIN,2023-10-01,admin");
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
