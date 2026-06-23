const qrcode = require("qrcode");
const { authenticator } = require("otplib");
const crypto = require("crypto");
const MfaSettings = require("../models/MfaSettings");
const User = require("../models/User");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// Configure otplib to handle slight time drift
authenticator.options = { window: 1 };

// @desc    Generate MFA Secret & QR Code
// @route   POST /api/mfa/setup
// @access  Private
exports.setupMfa = async (req, res) => {
    try {
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: req.user.id, tenantId: req.tenant._id });
        
        // Generate a new base32 secret
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email, "G-Axis", secret);

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

        // Save or update MFA settings (unenabled)
        let mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: req.user.id });
        if (!mfaSettings) {
            mfaSettings = new MfaSettings({ userId: req.user.id });
        }

        // If already enabled, prevent re-setup unless disabled first
        if (mfaSettings.isEnabled) {
            return res.status(400).json({ success: false, message: "MFA is already enabled on this account." });
        }

        mfaSettings.setEncryptedSecret(secret);
        await mfaSettings.save();

        res.status(200).json({
            success: true,
            data: {
                qrCodeUrl,
                secret // Only show once during setup for manual entry
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Verify initial setup OTP and activate MFA
// @route   POST /api/mfa/verify-setup
// @access  Private
exports.verifySetup = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Please provide the OTP token" });
        }

        const mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: req.user.id });
        if (!mfaSettings) {
            return res.status(400).json({ success: false, message: "MFA setup not initiated." });
        }

        const secret = mfaSettings.getDecryptedSecret();
        const isValid = authenticator.check(token, secret);

        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid OTP token" });
        }

        // Token is valid. Activate MFA.
        mfaSettings.isEnabled = true;
        mfaSettings.enabledAt = new Date();

        // Generate 10 backup codes
        const rawBackupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
        await mfaSettings.setBackupCodes(rawBackupCodes);
        await mfaSettings.save();

        res.status(200).json({
            success: true,
            message: "MFA successfully enabled",
            data: {
                backupCodes: rawBackupCodes // ONLY SHOWN ONCE
            }
        });

        auditService.logMfaEvent(req, auditEvents.MFA_ENABLED);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Disable MFA
// @route   POST /api/mfa/disable
// @access  Private
exports.disableMfa = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Please provide the OTP token to disable MFA" });
        }

        const mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: req.user.id });
        if (!mfaSettings || !mfaSettings.isEnabled) {
            return res.status(400).json({ success: false, message: "MFA is not enabled." });
        }

        const secret = mfaSettings.getDecryptedSecret();
        const isValid = authenticator.check(token, secret);

        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid OTP token" });
        }

        // Valid OTP provided. We can safely remove the MFA config entirely.
        await MfaSettings.findOneAndDelete({ _id: mfaSettings._id, tenantId: req.tenant._id });

        auditService.logMfaEvent(req, auditEvents.MFA_DISABLED);

        res.status(200).json({ success: true, message: "MFA successfully disabled" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Regenerate Backup Codes
// @route   POST /api/mfa/backup-codes
// @access  Private
exports.regenerateBackupCodes = async (req, res) => {
    try {
        const { token } = req.body; // Require OTP to regenerate
        if (!token) {
            return res.status(400).json({ success: false, message: "Please provide the OTP token" });
        }

        const mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: req.user.id });
        if (!mfaSettings || !mfaSettings.isEnabled) {
            return res.status(400).json({ success: false, message: "MFA is not enabled." });
        }

        const secret = mfaSettings.getDecryptedSecret();
        const isValid = authenticator.check(token, secret);

        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid OTP token" });
        }

        // Generate 10 new backup codes
        const rawBackupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
        await mfaSettings.setBackupCodes(rawBackupCodes);
        await mfaSettings.save();

        res.status(200).json({
            success: true,
            data: {
                backupCodes: rawBackupCodes
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
