const AuditLog = require("../models/AuditLog");

// @desc    Get all audit logs with advanced filtering and pagination
// @route   GET /api/audit-logs
// @access  Private (Requires 'audit_logs.read' permission)
exports.getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const { search, category, action, actorUserId, resourceType, startDate, endDate } = req.query;

        let query = {};

        // Text search across email, action, resourceType
        if (search) {
            query.$or = [
                { actorEmail: { $regex: search, $options: "i" } },
                { action: { $regex: search, $options: "i" } },
                { resourceType: { $regex: search, $options: "i" } },
            ];
        }

        // Exact filters
        if (category) query.category = category;
        if (action) query.action = action;
        if (actorUserId) query.actorUserId = actorUserId;
        if (resourceType) query.resourceType = resourceType;

        // Date Range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate("actorUserId", "firstName lastName email")
            .populate("targetUserId", "firstName lastName email")
            .lean(); // Faster reads since immutable

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs,
        });
    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
};

// @desc    Get single audit log by ID
// @route   GET /api/audit-logs/:id
// @access  Private (Requires 'audit_logs.read' permission)
exports.getAuditLogById = async (req, res) => {
    try {
        const log = await AuditLog.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id })
            .populate("actorUserId", "firstName lastName email")
            .populate("targetUserId", "firstName lastName email")
            .lean();

        if (!log) {
            return res.status(404).json({ error: "Audit log not found" });
        }

        res.status(200).json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
};
