const crypto = require("crypto");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// =====================================
// User-Facing Session APIs
// =====================================

// @desc    Get all active sessions for current user
// @route   GET /api/sessions
// @access  Private
exports.getMySessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            tenantId: req.tenant._id, userId: req.user.id })
            .select("-refreshTokenId") // Hide security tokens
            .sort("-lastActivityAt");

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get specific session details
// @route   GET /api/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            tenantId: req.tenant._id, _id: req.params.id, userId: req.user.id });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Revoke specific session
// @route   DELETE /api/sessions/:id
// @access  Private
exports.revokeSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            tenantId: req.tenant._id, _id: req.params.id, userId: req.user.id });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        // Revoke the underlying refresh token
        await RefreshToken.findOneAndUpdate({ _id: session.refreshTokenId, tenantId: req.tenant._id }, { revoked: true });
        
        session.status = "revoked";
        await session.save();

        auditService.logSessionEvent(req, auditEvents.SESSION_REVOKED, session._id, req.user.id);

        res.status(200).json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Revoke ALL sessions for current user
// @route   DELETE /api/sessions/logout-all
// @access  Private
exports.revokeAllSessions = async (req, res) => {
    try {
        await RefreshToken.updateMany({
            tenantId: req.tenant._id, userId: req.user.id }, { revoked: true });
        await Session.updateMany({
            tenantId: req.tenant._id, userId: req.user.id }, { status: "revoked" });

        // Burn current cookie just in case
        res.cookie("refreshToken", "none", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        auditService.logSessionEvent(req, auditEvents.SESSION_REVOKED_ALL, null, req.user.id);

        res.status(200).json({ success: true, message: "All sessions revoked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// =====================================
// Admin-Facing Session APIs
// =====================================

// @desc    Get all active sessions for any user
// @route   GET /api/users/:id/sessions
// @access  Private (Requires sessions.read or equivalent)
exports.getUserSessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            tenantId: req.tenant._id, userId: req.params.id })
            .select("-refreshTokenId")
            .sort("-lastActivityAt");

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Revoke all active sessions for any user
// @route   DELETE /api/users/:id/sessions
// @access  Private (Requires sessions.delete or equivalent)
exports.revokeUserSessions = async (req, res) => {
    try {
        await RefreshToken.updateMany({
            tenantId: req.tenant._id, userId: req.params.id }, { revoked: true });
        await Session.updateMany({
            tenantId: req.tenant._id, userId: req.params.id }, { status: "revoked" });

        auditService.logSessionEvent(req, auditEvents.SESSION_REVOKED_ALL, null, req.params.id, "success", { forcedByAdmin: true });

        res.status(200).json({ success: true, message: "User sessions forcibly revoked" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Force Revoke a specific session ID
// @route   DELETE /api/sessions/force/:id
// @access  Private (Requires sessions.delete)
exports.forceRevokeSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        // Revoke the underlying refresh token
        await RefreshToken.findOneAndUpdate({ _id: session.refreshTokenId, tenantId: req.tenant._id }, { revoked: true });
        
        session.status = "revoked";
        await session.save();

        auditService.logSessionEvent(req, auditEvents.SESSION_REVOKED, session._id, session.userId, "success", { forcedByAdmin: true });

        res.status(200).json({ success: true, message: "Session forcibly revoked" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
