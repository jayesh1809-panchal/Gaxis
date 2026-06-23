const UserApplicationAccess = require("../models/UserApplicationAccess");
const User = require("../models/User");
const Application = require("../models/Application");

// @desc    Get all applications accessible by a user
// @route   GET /api/users/:id/applications
// @access  Public (Mocked)
exports.getUserApplications = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Verify user exists
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: userId, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const accessRecords = await UserApplicationAccess.find({
            tenantId: req.tenant._id, userId })
            .populate("applicationId")
            .sort("-createdAt");

        res.status(200).json({ success: true, data: accessRecords });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Assign an application to a user
// @route   POST /api/users/:id/applications
// @access  Public (Mocked)
exports.assignApplication = async (req, res) => {
    try {
        const userId = req.params.id;
        const { applicationId } = req.body;

        if (!applicationId) {
            return res.status(400).json({ success: false, message: "Please provide an applicationId" });
        }

        // Verify User
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: userId, tenantId: req.tenant._id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify Application
        const application = await Application.findOne({
            tenantId: req.tenant._id, _id: applicationId, tenantId: req.tenant._id });
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        // Check if already assigned
        const existingAccess = await UserApplicationAccess.findOne({
            tenantId: req.tenant._id, userId, applicationId });
        if (existingAccess) {
            return res.status(400).json({ success: false, message: "Application already assigned to this user" });
        }

        const accessRecord = await UserApplicationAccess.create({
            tenantId: req.tenant._id,
            userId,
            applicationId,
            status: "active",
            // assignedBy: req.user._id // To be implemented with Authentication
        });

        res.status(201).json({ success: true, data: accessRecord });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Application already assigned to this user" });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update application access status (active / revoked)
// @route   PUT /api/users/:id/applications/:appId
// @access  Public (Mocked)
exports.updateApplicationAccess = async (req, res) => {
    try {
        const { id: userId, appId: applicationId } = req.params;
        const { status } = req.body;

        if (!["active", "revoked"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status. Must be 'active' or 'revoked'" });
        }

        const accessRecord = await UserApplicationAccess.findOneAndUpdate(
            { userId, applicationId },
            { status },
            { new: true, runValidators: true }
        );

        if (!accessRecord) {
            return res.status(404).json({ success: false, message: "Access record not found" });
        }

        res.status(200).json({ success: true, data: accessRecord });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Remove application access mapping
// @route   DELETE /api/users/:id/applications/:appId
// @access  Public (Mocked)
exports.removeApplicationAccess = async (req, res) => {
    try {
        const { id: userId, appId: applicationId } = req.params;

        const accessRecord = await UserApplicationAccess.findOneAndDelete({ userId, applicationId });

        if (!accessRecord) {
            return res.status(404).json({ success: false, message: "Access record not found" });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
