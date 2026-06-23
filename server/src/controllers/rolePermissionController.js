const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");
const Permission = require("../models/Permission");

// @desc    Get all permissions assigned to a role
// @route   GET /api/roles/:roleId/permissions
// @access  Public (Mocked)
exports.getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;

        // Verify role exists
        const role = await Role.findOne({
            tenantId: req.tenant._id, _id: roleId, tenantId: req.tenant._id });
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const assignments = await RolePermission.find({
            tenantId: req.tenant._id, roleId })
            .populate("permissionId")
            .sort("-createdAt");

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Assign permissions to a role (Bulk)
// @route   POST /api/roles/:roleId/permissions
// @access  Public (Mocked)
exports.assignPermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissionIds } = req.body;

        if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide an array of permissionIds" });
        }

        // Verify Role
        const role = await Role.findOne({
            tenantId: req.tenant._id, _id: roleId, tenantId: req.tenant._id });
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        // Verify all permissions exist
        const validPermissions = await Permission.find({
            tenantId: req.tenant._id, _id: { $in: permissionIds } });
        if (validPermissions.length !== permissionIds.length) {
            return res.status(400).json({ success: false, message: "One or more permission IDs are invalid" });
        }

        // Find existing assignments
        const existingAssignments = await RolePermission.find({
            tenantId: req.tenant._id, roleId, permissionId: { $in: permissionIds } });
        const existingPermissionIds = existingAssignments.map(a => a.permissionId.toString());

        // Filter out already assigned permissions
        const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

        // Prepare documents for bulk insert
        const newAssignments = newPermissionIds.map(permId => ({
            roleId,
            permissionId: permId,
            status: "active",
            // assignedBy: req.user._id // Phase 6 Auth
        }));

        let insertedCount = 0;
        if (newAssignments.length > 0) {
            await RolePermission.insertMany(newAssignments);
            insertedCount = newAssignments.length;
        }

        res.status(201).json({
            success: true,
            summary: {
                requested: permissionIds.length,
                added: insertedCount,
                ignoredDuplicates: permissionIds.length - insertedCount,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update role-permission assignment status
// @route   PUT /api/roles/:roleId/permissions/:permissionId
// @access  Public (Mocked)
exports.updateRolePermission = async (req, res) => {
    try {
        const { roleId, permissionId } = req.params;
        const { status } = req.body;

        if (!["active", "revoked"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const assignment = await RolePermission.findOneAndUpdate(
            { roleId, permissionId },
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

// @desc    Remove permission from a role
// @route   DELETE /api/roles/:roleId/permissions/:permissionId
// @access  Public (Mocked)
exports.removeRolePermission = async (req, res) => {
    try {
        const { roleId, permissionId } = req.params;

        const assignment = await RolePermission.findOneAndDelete({ roleId, permissionId });

        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
