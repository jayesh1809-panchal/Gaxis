const User = require("../models/User");
const UserApplicationAccess = require("../models/UserApplicationAccess");
const { resolveUserPermissions } = require("../services/rbacService");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// @desc    Create new user
// @route   POST /api/users
// @access  Public (Mocked)
exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, employeeId, department, designation, avatar, status } = req.body;

        // Validation Check: Email
        const existingEmail = await User.findOne({
            tenantId: req.tenant._id, email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // Validation Check: Employee ID
        if (employeeId) {
            const existingEmpId = await User.findOne({
            tenantId: req.tenant._id, employeeId });
            if (existingEmpId) {
                return res.status(400).json({ success: false, message: "Employee ID already exists" });
            }
        }

        const user = await User.create({
            tenantId: req.tenant._id,
            firstName,
            lastName,
            email,
            employeeId,
            department,
            designation,
            avatar,
            status: status || "active",
        });

        auditService.logEvent({
            req,
            action: auditEvents.USER_CREATED,
            category: "Users",
            resourceType: "User",
            resourceId: user._id,
            targetUserId: user._id,
            metadata: { email: user.email }
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all users (with pagination, search, status filtering)
// @route   GET /api/users
// @access  Public (Mocked)
exports.getUsers = async (req, res) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude from standard matching
        const removeFields = ["page", "limit", "search"];
        removeFields.forEach((param) => delete reqQuery[param]);

        // Build query string for standard filters (like status)
        query = User.find(reqQuery);

        // Search logic
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            query = query.find({
            tenantId: req.tenant._id,
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { employeeId: searchRegex }
                ],
            });
        }

        // Pagination setup
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        // Query execution
        const total = await User.countDocuments(query);
        query = query.skip(startIndex).limit(limit).sort("-createdAt");
        
        const users = await query;

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: users,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public (Mocked)
exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Public (Mocked)
exports.updateUser = async (req, res) => {
    try {
        const { email, employeeId } = req.body;

        // Check duplicates if changing email/employeeId
        if (email) {
            const checkEmail = await User.findOne({
            tenantId: req.tenant._id, email, _id: { $ne: req.params.id } });
            if (checkEmail) return res.status(400).json({ success: false, message: "Email already exists" });
        }
        if (employeeId) {
            const checkEmpId = await User.findOne({
            tenantId: req.tenant._id, employeeId, _id: { $ne: req.params.id } });
            if (checkEmpId) return res.status(400).json({ success: false, message: "Employee ID already exists" });
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        auditService.logEvent({
            req,
            action: auditEvents.USER_UPDATED,
            category: "Users",
            resourceType: "User",
            resourceId: user._id,
            targetUserId: user._id,
            metadata: req.body
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update user status (e.g. active/inactive/suspended)
// @route   PUT /api/users/:id/status
// @access  Public (Mocked)
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["active", "inactive", "suspended"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        auditService.logEvent({
            req,
            action: auditEvents.USER_UPDATED,
            category: "Users",
            resourceType: "User",
            resourceId: user._id,
            targetUserId: user._id,
            metadata: { status }
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public (Mocked)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await user.deleteOne();
        
        // Cascade delete application access mappings
        await UserApplicationAccess.deleteMany({
            tenantId: req.tenant._id, userId: req.params.id });

        auditService.logEvent({
            req,
            action: auditEvents.USER_DELETED,
            category: "Users",
            resourceType: "User",
            resourceId: user._id,
            targetUserId: user._id,
            metadata: { email: user.email }
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get effective permissions for a user (RBAC Resolution)
// @route   GET /api/users/:id/effective-permissions
// @access  Public (Mocked)
exports.getEffectivePermissions = async (req, res) => {
    try {
        const { id } = req.params;

        const resolvedData = await resolveUserPermissions(id);

        res.status(200).json({
            success: true,
            data: {
                userId: id,
                roles: resolvedData.roles,
                permissions: resolvedData.permissions
            }
        });
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
