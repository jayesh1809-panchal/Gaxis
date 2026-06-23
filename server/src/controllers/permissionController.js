const Permission = require("../models/Permission");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// Helper function to normalize code format
const normalizeCode = (code) => {
    return code ? code.toLowerCase().replace(/\s+/g, "") : code;
};

// @desc    Create new permission
// @route   POST /api/permissions
// @access  Public (Mocked)
exports.createPermission = async (req, res) => {
    try {
        let { name, code, module, description, status, isSystemPermission, permissionScope, applicationId } = req.body;

        code = normalizeCode(code);

        // Check duplicates
        const existingName = await Permission.findOne({
            tenantId: req.tenant._id, name });
        if (existingName) return res.status(400).json({ success: false, message: "Permission name already exists" });

        const existingCode = await Permission.findOne({
            tenantId: req.tenant._id, code });
        if (existingCode) return res.status(400).json({ success: false, message: "Permission code already exists" });

        // If permissionScope is SYSTEM, applicationId should be null
        if (permissionScope === "SYSTEM") {
            applicationId = null;
        }

        const permission = await Permission.create({
            tenantId: req.tenant._id,
            name,
            code,
            module,
            description,
            status,
            isSystemPermission: isSystemPermission || false,
            permissionScope,
            applicationId,
        });

        auditService.logEvent({
            req,
            action: auditEvents.PERMISSION_CREATED,
            category: "Permissions",
            resourceType: "Permission",
            resourceId: permission._id,
            metadata: { name: permission.name, code: permission.code }
        });

        res.status(201).json({ success: true, data: permission });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all permissions (with pagination, search, filters)
// @route   GET /api/permissions
// @access  Public (Mocked)
exports.getPermissions = async (req, res) => {
    try {
        let query;

        const reqQuery = { ...req.query };
        const removeFields = ["page", "limit", "search"];
        removeFields.forEach((param) => delete reqQuery[param]);

        // Standard matches (e.g. status=active, module=USERS)
        query = Permission.find(reqQuery);

        // Search logic
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            query = query.find({
            tenantId: req.tenant._id,
                $or: [
                    { name: searchRegex },
                    { code: searchRegex },
                    { description: searchRegex }
                ],
            });
        }

        // Pagination setup
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await Permission.countDocuments(query);
        
        // Populate applicationId name if it's an APPLICATION permission
        query = query.skip(startIndex).limit(limit).sort("module code").populate("applicationId", "name code");
        
        const permissions = await query;

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: permissions,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get single permission
// @route   GET /api/permissions/:id
// @access  Public (Mocked)
exports.getPermission = async (req, res) => {
    try {
        const permission = await Permission.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id }).populate("applicationId", "name code");
        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission not found" });
        }
        res.status(200).json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Public (Mocked)
exports.updatePermission = async (req, res) => {
    try {
        const permission = await Permission.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        
        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission not found" });
        }

        let { name, code, module, description, permissionScope, applicationId } = req.body;

        // Protection Rules for System Permissions
        if (permission.isSystemPermission) {
            if (name && name !== permission.name) return res.status(403).json({ success: false, message: "Cannot modify name of a System Permission" });
            if (code && normalizeCode(code) !== permission.code) return res.status(403).json({ success: false, message: "Cannot modify code of a System Permission" });
        } else {
            // Check duplicates for Custom Permissions
            if (name && name !== permission.name) {
                const existingName = await Permission.findOne({
            tenantId: req.tenant._id, name });
                if (existingName) return res.status(400).json({ success: false, message: "Permission name already exists" });
            }
            if (code && normalizeCode(code) !== permission.code) {
                const existingCode = await Permission.findOne({
            tenantId: req.tenant._id, code: normalizeCode(code) });
                if (existingCode) return res.status(400).json({ success: false, message: "Permission code already exists" });
            }
        }

        // Apply updates
        if (name && !permission.isSystemPermission) permission.name = name;
        if (code && !permission.isSystemPermission) permission.code = normalizeCode(code);
        if (module) permission.module = module;
        if (description !== undefined) permission.description = description;
        if (permissionScope) permission.permissionScope = permissionScope;
        if (applicationId !== undefined) {
            permission.applicationId = permission.permissionScope === "SYSTEM" ? null : applicationId;
        }

        await permission.save();

        auditService.logEvent({
            req,
            action: auditEvents.PERMISSION_UPDATED,
            category: "Permissions",
            resourceType: "Permission",
            resourceId: permission._id,
            metadata: { name, code, module, description, permissionScope }
        });

        res.status(200).json({ success: true, data: permission });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update permission status
// @route   PUT /api/permissions/:id/status
// @access  Public (Mocked)
exports.updatePermissionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const permission = await Permission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission not found" });
        }

        auditService.logEvent({
            req,
            action: auditEvents.PERMISSION_UPDATED,
            category: "Permissions",
            resourceType: "Permission",
            resourceId: permission._id,
            metadata: { status }
        });

        res.status(200).json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Public (Mocked)
exports.deletePermission = async (req, res) => {
    try {
        const permission = await Permission.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        
        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission not found" });
        }

        // Protection Rules
        if (permission.isSystemPermission) {
            return res.status(403).json({ success: false, message: "Cannot delete a System Permission" });
        }

        await permission.deleteOne();

        auditService.logEvent({
            req,
            action: auditEvents.PERMISSION_DELETED,
            category: "Permissions",
            resourceType: "Permission",
            resourceId: permission._id,
            metadata: { name: permission.name, code: permission.code }
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
