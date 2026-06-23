const UserRole = require("../models/UserRole");
const User = require("../models/User");
const Role = require("../models/Role");

// @desc    Get all roles assigned to a user
// @route   GET /api/users/:userId/roles
// @access  Public (Mocked)
exports.getUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user exists
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: userId, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const assignments = await UserRole.find({
            tenantId: req.tenant._id, userId })
            .populate("roleId")
            .sort("-createdAt");

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Assign roles to a user (Bulk)
// @route   POST /api/users/:userId/roles
// @access  Public (Mocked)
exports.assignRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleIds, reason } = req.body;

        if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide an array of roleIds" });
        }

        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(req.tenant._id, "ROLE_ASSIGNMENT", req.user, { userId, roleIds }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                req.tenant._id,
                req.user._id,
                "ROLE_ASSIGNMENT",
                { userId, roleIds },
                reason || "Request role assignment escalation",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Role assignment requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        // Verify User
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: userId, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify all roles exist
        const validRoles = await Role.find({
            tenantId: req.tenant._id, _id: { $in: roleIds } });
        if (validRoles.length !== roleIds.length) {
            return res.status(400).json({ success: false, message: "One or more role IDs are invalid" });
        }

        // Find existing assignments
        const existingAssignments = await UserRole.find({
            tenantId: req.tenant._id, userId, roleId: { $in: roleIds } });
        const existingRoleIds = existingAssignments.map(a => a.roleId.toString());

        // Filter out already assigned roles
        const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

        // Prepare documents for bulk insert
        const newAssignments = newRoleIds.map(rId => ({
            tenantId: req.tenant._id,
            userId,
            roleId: rId,
            status: "active",
            // assignedBy: req.user._id // Phase 6 Auth
        }));

        let insertedCount = 0;
        if (newAssignments.length > 0) {
            await UserRole.insertMany(newAssignments);
            insertedCount = newAssignments.length;
        }

        res.status(201).json({
            success: true,
            summary: {
                requested: roleIds.length,
                added: insertedCount,
                ignoredDuplicates: roleIds.length - insertedCount,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update user-role assignment status
// @route   PUT /api/users/:userId/roles/:roleId
// @access  Public (Mocked)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        const { status } = req.body;

        if (!["active", "revoked"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const assignment = await UserRole.findOneAndUpdate(
            { userId, roleId },
            { status },
            { new: true, runValidators: true }
        );

        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Remove role from a user
// @route   DELETE /api/users/:userId/roles/:roleId
// @access  Public (Mocked)
exports.removeUserRole = async (req, res) => {
    try {
        const { userId, roleId } = req.params;

        const assignment = await UserRole.findOneAndDelete({ userId, roleId });

        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
