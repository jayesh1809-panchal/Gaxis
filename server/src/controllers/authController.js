const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip");
const UAParser = require("ua-parser-js");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const MfaSettings = require("../models/MfaSettings");
const { authenticator } = require("otplib");
const { resolveUserPermissions } = require("../services/rbacService");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// Helper to generate tokens
const generateTokens = async (user, req) => {
    // 1. Resolve RBAC Permissions
    const { roles, permissions } = await resolveUserPermissions(user._id);

    // 2. Generate Access Token (15m)
    const accessToken = jwt.sign(
        { id: user._id, roles, permissions, tenantId: user.tenantId, tenantCode: req.tenant.code },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    // 3. Generate Refresh Token (7d)
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const dbRefreshToken = await RefreshToken.create({
            tenantId: req.tenant._id,
            tenantId: req.tenant._id,
        userId: user._id,
        tokenHash,
        familyId,
        expiresAt
    });

    // 4. Create Session
    const ipAddress = requestIp.getClientIp(req);
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const deviceInfo = device.vendor ? `${device.vendor} ${device.model}` : "Desktop/Unknown Device";
    const browserStr = browser.name ? `${browser.name} ${browser.version}` : "Unknown Browser";
    const osStr = os.name ? `${os.name} ${os.version}` : "Unknown OS";

    await Session.create({
            tenantId: req.tenant._id,
            tenantId: req.tenant._id,
        userId: user._id,
        refreshTokenId: dbRefreshToken._id,
        deviceInfo,
        browser: browserStr,
        operatingSystem: osStr,
        ipAddress,
        // Optional: Location could be added via geoip-lite if needed
        expiresAt
    });

    return { accessToken, refreshToken };
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        // Fetch user with password
        const user = await User.findOne({
            tenantId: req.tenant._id,
            tenantId: req.tenant._id, email }).select("+passwordHash");

        if (!user) {
            auditService.logAuthEvent(req, auditEvents.USER_LOGIN_FAILED, "failure", { email, reason: "Invalid credentials" });
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Check if locked
        if (user.isLocked()) {
            auditService.logAuthEvent(req, auditEvents.USER_LOGIN_FAILED, "failure", { email, reason: "Account locked" });
            return res.status(401).json({ success: false, message: "Account is temporarily locked due to too many failed attempts" });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            // Handle failed attempt
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
            }
            await user.save();
            auditService.logAuthEvent(req, auditEvents.USER_LOGIN_FAILED, "failure", { email, reason: "Invalid password" });
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Success - Reset attempts and lock
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLoginAt = new Date();
        await user.save();

        // ---------------- MFA Check ----------------
        const mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: user._id });
        if (mfaSettings && mfaSettings.isEnabled) {
            // Issue a short-lived Pre-Auth token for the MFA validation step
            const preAuthToken = jwt.sign(
                { id: user._id, mfaRequired: true },
                process.env.JWT_SECRET || 'dev_secret',
                { expiresIn: '5m' } // 5 minutes to complete MFA
            );
            
            return res.status(200).json({
                success: true,
                data: {
                    mfaRequired: true,
                    preAuthToken,
                    message: "MFA required to complete login."
                }
            });
        }
        // -------------------------------------------

        const { accessToken, refreshToken } = await generateTokens(user, req);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Inject req.user so audit logger can pick it up
        req.user = user;
        auditService.logAuthEvent(req, auditEvents.USER_LOGIN);

        res.status(200).json({
            success: true,
            data: { accessToken, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, status: user.status } }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Verify MFA token to complete login
// @route   POST /api/auth/verify-mfa
// @access  Public
exports.verifyMfa = async (req, res) => {
    try {
        const { preAuthToken, token } = req.body; // 'token' is the 6-digit OTP or Backup Code

        if (!preAuthToken || !token) {
            return res.status(400).json({ success: false, message: "Please provide both preAuthToken and MFA token" });
        }

        // 1. Verify Pre-Auth Token
        let decoded;
        try {
            decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET || 'dev_secret');
        } catch (error) {
            return res.status(401).json({ success: false, message: "Session expired or invalid. Please login again." });
        }

        if (!decoded.mfaRequired || !decoded.id) {
            return res.status(401).json({ success: false, message: "Invalid preAuth token" });
        }

        // 2. Fetch User and MFA Settings
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: decoded.id, tenantId: req.tenant._id });
        if (!user || user.status === "inactive" || user.isLocked()) {
            return res.status(401).json({ success: false, message: "User account inactive or locked" });
        }

        const mfaSettings = await MfaSettings.findOne({
            tenantId: req.tenant._id, userId: user._id });
        if (!mfaSettings || !mfaSettings.isEnabled) {
            return res.status(400).json({ success: false, message: "MFA is not enabled for this account" });
        }

        // 3. Validate Token
        let isValid = false;
        
        // Check if it's a backup code (usually 8 chars hex)
        if (token.length > 6) {
            const matchedCodeHash = await mfaSettings.matchBackupCode(token);
            if (matchedCodeHash) {
                isValid = true;
                // Remove the used backup code
                mfaSettings.backupCodes = mfaSettings.backupCodes.filter(c => c !== matchedCodeHash);
                await mfaSettings.save();
            }
        } else {
            // Check TOTP
            const secret = mfaSettings.getDecryptedSecret();
            isValid = authenticator.check(token, secret);
        }

        if (!isValid) {
            // Can optionally implement MFA specific rate-limiting here
            req.user = user;
            auditService.logMfaEvent(req, auditEvents.MFA_VERIFY_FAILED, "failure", { reason: "Invalid OTP" });
            return res.status(401).json({ success: false, message: "Invalid MFA token" });
        }

        req.user = user;
        auditService.logMfaEvent(req, auditEvents.MFA_VERIFIED);
        auditService.logAuthEvent(req, auditEvents.USER_LOGIN);

        // 4. Success - Mint Real Tokens
        const { accessToken, refreshToken } = await generateTokens(user, req);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            data: { accessToken, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, status: user.status } }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Logout user (Single Device)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (refreshToken) {
            const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
            const dbToken = await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
            if (dbToken) {
                await Session.findOneAndUpdate({ refreshTokenId: dbToken._id }, { status: "revoked" });
            }
        }

        res.cookie("refreshToken", "none", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        auditService.logAuthEvent(req, auditEvents.USER_LOGOUT);

        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Logout user (All Devices)
// @route   POST /api/auth/logout-all
// @access  Public
exports.logoutAll = async (req, res) => {
    try {
        const { userId } = req.body; // Will come from JWT later
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        await RefreshToken.updateMany({
            tenantId: req.tenant._id, userId }, { revoked: true });
        await Session.updateMany({
            tenantId: req.tenant._id, userId }, { status: "revoked" });

        res.cookie("refreshToken", "none", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        req.user = { id: userId }; // So the log can target the specific user
        auditService.logAuthEvent(req, auditEvents.SESSION_REVOKED_ALL);

        res.status(200).json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken;
        
        if (!incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }

        const tokenHash = crypto.createHash("sha256").update(incomingRefreshToken).digest("hex");
        const foundToken = await RefreshToken.findOne({
            tenantId: req.tenant._id, tokenHash });

        if (!foundToken) {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        if (foundToken.revoked) {
            // Token Reuse Detected! Revoke entire token family
            await RefreshToken.updateMany({
            tenantId: req.tenant._id, familyId: foundToken.familyId }, { revoked: true });
            
            // Burn the related sessions
            const familyTokens = await RefreshToken.find({
            tenantId: req.tenant._id, familyId: foundToken.familyId });
            const tokenIds = familyTokens.map(t => t._id);
            await Session.updateMany({
            tenantId: req.tenant._id, refreshTokenId: { $in: tokenIds } }, { status: "revoked" });
            
            res.cookie("refreshToken", "none", {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true
            });
            return res.status(401).json({ success: false, message: "Security Warning: Reuse of revoked token detected. All sessions terminated. Please log in again." });
        }

        // Verify Expiry
        if (foundToken.expiresAt < new Date()) {
            await RefreshToken.findOneAndDelete({ _id: foundToken._id, tenantId: req.tenant._id });
            return res.status(401).json({ success: false, message: "Refresh token expired. Please log in again." });
        }

        // Verify User
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: foundToken.userId, tenantId: req.tenant._id });
        if (!user || user.status === "inactive" || user.isLocked()) {
            return res.status(401).json({ success: false, message: "User account inactive or locked" });
        }

        // Revoke the old token (Token Rotation)
        foundToken.revoked = true;
        await foundToken.save();

        // 1. Resolve RBAC Permissions
        const { roles, permissions } = await resolveUserPermissions(user._id);

        // 2. Mint new Access Token
        const accessToken = jwt.sign(
            { id: user._id, roles, permissions, tenantId: user.tenantId, tenantCode: req.tenant.code },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: process.env.JWT_EXPIRE || '15m' }
        );

        // 3. Mint new Refresh Token in the same family
        const newRefreshToken = crypto.randomBytes(40).toString("hex");
        const newTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
        
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const newDbToken = await RefreshToken.create({
            tenantId: req.tenant._id,
            userId: user._id,
            tokenHash: newTokenHash,
            familyId: foundToken.familyId, // Maintain family lineage
            expiresAt
        });

        // 4. Update the Session pointer
        await Session.findOneAndUpdate(
            { refreshTokenId: foundToken._id },
            { 
                refreshTokenId: newDbToken._id,
                lastActivityAt: Date.now()
            }
        );

        // Set new HttpOnly cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ success: true, data: { accessToken } });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
