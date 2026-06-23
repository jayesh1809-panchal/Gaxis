const Role = require("../models/Role");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// Helper function to normalize code format
const normalizeCode = (code) => {
    return code ? code.toUpperCase().replace(/\s+/g, "_") : code;
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Public (Mocked)
exports.createRole = async (req, res) => {
    try {
        let { name, code, description, status, isSystemRole, roleType, applicationId } = req.body;

        code = normalizeCode(code);

        // Check duplicates
        const existingName = await Role.findOne({
            tenantId: req.tenant._id, name });
        if (existingName) return res.status(400).json({ success: false, message: "Role name already exists" });

        const existingCode = await Role.findOne({
            tenantId: req.tenant._id, code });
        if (existingCode) return res.status(400).json({ success: false, message: "Role code already exists" });

        // Security override: Only system seeders can create isSystemRole directly (for now, we allow it for testing but ideally it's locked down)
        // If roleType is SYSTEM, applicationId should be null
        if (roleType === "SYSTEM") {
            applicationId = null;
        }

        const role = await Role.create({
            tenantId: req.tenant._id,
            name,
            code,
            description,
            status,
            isSystemRole: isSystemRole || false,
            roleType,
            applicationId,
        });

        auditService.logEvent({
            req,
            action: auditEvents.ROLE_CREATED,
            category: "Roles",
            resourceType: "Role",
            resourceId: role._id,
            metadata: { name: role.name, code: role.code }
        });

        res.status(201).json({ success: true, data: role });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all roles (with pagination, search, filters)
// @route   GET /api/roles
// @access  Public (Mocked)
exports.getRoles = async (req, res) => {
    try {
        let query;

        const reqQuery = { ...req.query };
        const removeFields = ["page", "limit", "search"];
        removeFields.forEach((param) => delete reqQuery[param]);

        // Standard matches (e.g. status=active, roleType=SYSTEM)
        query = Role.find(reqQuery);

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

        const total = await Role.countDocuments(query);
        
        // Populate applicationId name if it's an APPLICATION role
        query = query.skip(startIndex).limit(limit).sort("-createdAt").populate("applicationId", "name code");
        
        const roles = await query;

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: roles,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Public (Mocked)
exports.getRole = async (req, res) => {
    try {
        const role = await Role.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id }).populate("applicationId", "name code");
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }
        res.status(200).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Public (Mocked)
exports.updateRole = async (req, res) => {
    try {
        const role = await Role.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        let { name, code, description, roleType, applicationId } = req.body;

        // Protection Rules for System Roles
        if (role.isSystemRole) {
            if (name && name !== role.name) return res.status(403).json({ success: false, message: "Cannot modify name of a System Role" });
            if (code && normalizeCode(code) !== role.code) return res.status(403).json({ success: false, message: "Cannot modify code of a System Role" });
        } else {
            // Check duplicates for Custom Roles
            if (name && name !== role.name) {
                const existingName = await Role.findOne({
            tenantId: req.tenant._id, name });
                if (existingName) return res.status(400).json({ success: false, message: "Role name already exists" });
            }
            if (code && normalizeCode(code) !== role.code) {
                const existingCode = await Role.findOne({
            tenantId: req.tenant._id, code: normalizeCode(code) });
                if (existingCode) return res.status(400).json({ success: false, message: "Role code already exists" });
            }
        }

        // Apply updates
        if (name) role.name = name;
        if (code && !role.isSystemRole) role.code = normalizeCode(code);
        if (description !== undefined) role.description = description;
        if (roleType) role.roleType = roleType;
        if (applicationId !== undefined) {
            role.applicationId = role.roleType === "SYSTEM" ? null : applicationId;
        }

        await role.save();

        auditService.logEvent({
            req,
            action: auditEvents.ROLE_UPDATED,
            category: "Roles",
            resourceType: "Role",
            resourceId: role._id,
            metadata: { name, code, description, roleType }
        });

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update role status
// @route   PUT /api/roles/:id/status
// @access  Public (Mocked)
exports.updateRoleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const role = await Role.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        auditService.logEvent({
            req,
            action: auditEvents.ROLE_UPDATED,
            category: "Roles",
            resourceType: "Role",
            resourceId: role._id,
            metadata: { status }
        });

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Public (Mocked)
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        // Protection Rules
        if (role.isSystemRole) {
            return res.status(403).json({ success: false, message: "Cannot delete a System Role" });
        }

        await role.deleteOne();

        auditService.logEvent({
            req,
            action: auditEvents.ROLE_DELETED,
            category: "Roles",
            resourceType: "Role",
            resourceId: role._id,
            metadata: { name: role.name, code: role.code }
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
