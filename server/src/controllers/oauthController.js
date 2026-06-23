const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AuthorizationCode = require("../models/AuthorizationCode");
const Application = require("../models/Application");
const User = require("../models/User");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const SecurityPolicy = require("../models/SecurityPolicy");
const ApplicationSecret = require("../models/ApplicationSecret");
const { resolveUserPermissions } = require("../services/rbacService");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// PKCE Verification utility
function base64URLEncode(buffer) {
    return buffer.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function verifyPKCE(codeChallenge, codeVerifier, method) {
    if (method === "S256") {
        const hash = crypto.createHash("sha256").update(codeVerifier).digest();
        return base64URLEncode(hash) === codeChallenge;
    }
    return codeVerifier === codeChallenge; // "plain"
}

// @desc    Issue Authorization Code
// @route   GET /api/oauth/authorize
// @access  Private (User must be logged in via session)
exports.authorize = async (req, res) => {
    try {
        const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method, nonce } = req.query;

        // 1. Authenticate user from refreshToken cookie
        const incomingRefreshToken = req.cookies?.refreshToken;
        let user = null;

        console.log("AUTHORIZE HIT");
        console.log("CLIENT:", client_id);

        if (incomingRefreshToken && incomingRefreshToken !== "none") {
            const tokenHash = crypto.createHash("sha256").update(incomingRefreshToken).digest("hex");
            const foundToken = await RefreshToken.findOne({ tenantId: req.tenant._id, tokenHash });

            if (foundToken && !foundToken.revoked && foundToken.expiresAt > new Date()) {
                user = await User.findOne({ tenantId: req.tenant._id, _id: foundToken.userId });
            }
        }

        // 2. If no valid user, redirect to login page with originalUrl as returnTo
        if (!user || user.status === "inactive" || user.isLocked()) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5011";
            const returnTo = encodeURIComponent(req.originalUrl); // e.g. /api/oauth/authorize?client_id=...
            return res.redirect(`${frontendUrl}/login?returnTo=${returnTo}`);
        }

        req.user = user; // Attach user to request
        console.log("USER:", req.user?._id);

        if (response_type !== "code") {
            return res.status(400).json({ error: "unsupported_response_type" });
        }

        const authQuery = {
            tenantId: req.tenant?._id,
            clientId: client_id,
            status: "active"
        };
        console.log("AUTHORIZE QUERY", authQuery);
        console.log("REQUEST TENANT", req.tenant);

        const application = await Application.findOne(authQuery);

        // Phase 7: Temporary Debug Logging
        console.log("CLIENT_ID:", client_id);
        console.log("CLIENT FOUND:", application);
        console.log("REDIRECT URI:", redirect_uri);

        if (!application) {
            return res.status(400).json({ error: "invalid_client", error_description: "Client not found or inactive" });
        }

        const policy = await SecurityPolicy.findOne({ applicationId: application._id });
        if (policy) {
            if (policy.maintenanceMode || policy.emergencyLockdown) {
                return res.status(503).json({ error: "temporarily_unavailable", error_description: "Application is currently locked or in maintenance" });
            }
        }

        if (!application.redirectUris.includes(redirect_uri)) {
            return res.status(400).json({ error: "invalid_request", error_description: "Invalid redirect URI" });
        }

        if (!code_challenge) {
            return res.status(400).json({ error: "invalid_request", error_description: "code_challenge is required (PKCE)" });
        }

        // Generate Code
        const code = crypto.randomBytes(32).toString("hex");

        const authCode = new AuthorizationCode({
            tenantId: req.tenant._id,
            code,
            userId: req.user._id,
            clientId: client_id,
            redirectUri: redirect_uri,
            scopes: scope ? scope.split(" ") : [],
            codeChallenge: code_challenge,
            codeChallengeMethod: code_challenge_method || "plain",
            nonce,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes TTL
        });

        console.log("AUTH CODE CREATE", {
            tenantId: req.tenant?._id,
            userId: req.user?._id,
            clientId: application?.clientId
        });

        await authCode.save();

        auditService.logSsoEvent(req, auditEvents.OAUTH_CODE_ISSUED, application._id, { clientId: client_id, scopes: authCode.scopes });

        let redirectUrl = `${redirect_uri}?code=${code}`;
        if (state) {
            redirectUrl += `&state=${encodeURIComponent(state)}`;
        }

        res.redirect(redirectUrl);
    } catch (error) {
        res.status(500).json({ error: "server_error", error_description: error.message });
    }
};

// @desc    Exchange Code for Tokens
// @route   POST /api/oauth/token
// @access  Public
exports.token = async (req, res) => {
    try {
        console.log("========== TOKEN REQUEST ==========");
        console.log("BODY:", req.body);
        console.log("HEADERS:", req.headers);

        const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = req.body;

        console.log("CODE:", code);
        console.log("CLIENT_ID:", client_id);
        console.log("CODE_VERIFIER:", code_verifier);
        console.log("GRANT_TYPE:", grant_type);

        if (grant_type !== "authorization_code" && grant_type !== "refresh_token") {
            return res.status(400).json({ error: "unsupported_grant_type" });
        }

        let user;
        let application;
        let oldRefreshToken = null;

        application = await Application.findOne({
            tenantId: req.tenant._id, clientId: client_id
        });
        console.log("APPLICATION FOUND:", application);

        if (!application) {
            return res.status(400).json({ error: "invalid_client", error_description: "Client not found or inactive" });
        }

        const policy = await SecurityPolicy.findOne({ applicationId: application._id });
        if (policy && (policy.maintenanceMode || policy.emergencyLockdown)) {
            return res.status(503).json({ error: "temporarily_unavailable", error_description: "Application is currently locked" });
        }

        if (application.clientType === "confidential") {
            if (!client_secret) {
                return res.status(401).json({ error: "invalid_client", error_description: "client_secret is required for confidential clients" });
            }

            // Check against active and legacy secrets within grace period
            const secrets = await ApplicationSecret.find({
                applicationId: application._id,
                status: { $in: ["active", "legacy"] }
            });

            let isSecretValid = false;
            for (const s of secrets) {
                if (s.status === "legacy" && s.expiresAt < new Date()) {
                    continue; // Expired legacy secret
                }
                const isMatch = await crypto.createHash("sha256").update(client_secret).digest("hex") === s.secretHash;
                if (isMatch) {
                    isSecretValid = true;
                    break;
                }
            }

            if (!isSecretValid) {
                return res.status(401).json({ error: "invalid_client", error_description: "Invalid client_secret" });
            }
        }

        if (grant_type === "authorization_code") {
            if (!code || !redirect_uri || !client_id || !code_verifier) {
                return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters" });
            }

            const authCode = await AuthorizationCode.findOne({
                tenantId: req.tenant._id, code, clientId: client_id, redirectUri: redirect_uri
            });

            console.log("AUTH CODE FOUND:", authCode);

            if (!authCode) {
                return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired authorization code" });
            }

            if (authCode.used) {
                return res.status(400).json({ error: "invalid_grant", error_description: "Authorization code already used" });
            }

            // PKCE Verification
            console.log("STORED CHALLENGE:", authCode?.codeChallenge);
            console.log("RECEIVED VERIFIER:", code_verifier);

            const isValidPKCE = verifyPKCE(authCode.codeChallenge, code_verifier, authCode.codeChallengeMethod);
            if (!isValidPKCE) {
                return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
            }

            console.log("PKCE VALIDATION PASSED");

            authCode.used = true;
            await authCode.save();

            user = await User.findOne({
                tenantId: req.tenant._id, _id: authCode.userId
            });

        } else if (grant_type === "refresh_token") {
            if (!refresh_token) {
                return res.status(400).json({ error: "invalid_request", error_description: "Missing refresh_token" });
            }

            const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");
            oldRefreshToken = await RefreshToken.findOne({ tenantId: req.tenant._id, tokenHash });

            if (!oldRefreshToken) {
                return res.status(400).json({ error: "invalid_grant", error_description: "Invalid refresh token" });
            }

            if (oldRefreshToken.revoked) {
                await RefreshToken.updateMany({ tenantId: req.tenant._id, familyId: oldRefreshToken.familyId }, { revoked: true });
                return res.status(400).json({ error: "invalid_grant", error_description: "Token reuse detected. All tokens revoked." });
            }

            if (oldRefreshToken.expiresAt < new Date()) {
                await RefreshToken.findOneAndDelete({ _id: oldRefreshToken._id, tenantId: req.tenant._id });
                return res.status(400).json({ error: "invalid_grant", error_description: "Refresh token expired" });
            }

            user = await User.findOne({ tenantId: req.tenant._id, _id: oldRefreshToken.userId });

            oldRefreshToken.revoked = true;
            await oldRefreshToken.save();
        }

        if (!user || user.status === "inactive" || user.isLocked()) {
            return res.status(401).json({ error: "invalid_grant", error_description: "User account inactive or locked" });
        }

        const { roles, permissions } = await resolveUserPermissions(user._id);

        const accessTokenTtl = policy?.accessTokenTtl || 3600;
        const refreshTokenTtl = policy?.refreshTokenTtl || 604800;

        const accessToken = jwt.sign(
            { id: user._id, tenantId: req.tenant._id, permissions, clientId: client_id },
            process.env.JWT_SECRET || "dev_secret",
            { expiresIn: accessTokenTtl }
        );

        let idToken;
        if (process.env.OIDC_PRIVATE_KEY && grant_type === "authorization_code") {
            const payload = {
                iss: process.env.OIDC_ISSUER || "http://localhost:5011",
                sub: user._id.toString(),
                aud: client_id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenantId: req.tenant._id,
                roles,
                permissions
            };

            const privateKey = process.env.OIDC_PRIVATE_KEY.replace(/\\n/g, "\n");
            idToken = jwt.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: accessTokenTtl,
                keyid: "sig-1"
            });
        }

        const newRefreshTokenStr = crypto.randomBytes(40).toString("hex");
        const newTokenHash = crypto.createHash("sha256").update(newRefreshTokenStr).digest("hex");
        const familyId = oldRefreshToken ? oldRefreshToken.familyId : crypto.randomUUID();
        const expiresAt = new Date(Date.now() + refreshTokenTtl * 1000);

        const newDbToken = await RefreshToken.create({
            tenantId: req.tenant._id,
            userId: user._id,
            applicationId: application._id,
            tokenHash: newTokenHash,
            familyId,
            expiresAt
        });

        if (grant_type === "authorization_code") {
            // Create a Session
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'] || "Unknown";

            await Session.create({
                tenantId: req.tenant._id,
                userId: user._id,
                applicationId: application._id,
                refreshTokenId: newDbToken._id,
                deviceInfo: "OAuth Application",
                browser: userAgent.substring(0, 50),
                operatingSystem: "Unknown",
                ipAddress,
                expiresAt: new Date(Date.now() + (policy?.absoluteSessionLifetime || 2592000) * 1000)
            });

            auditService.logSsoEvent(req, auditEvents.SSO_LOGIN, application._id, { clientId: client_id, grantType: grant_type });
        } else if (grant_type === "refresh_token") {
            // Update existing Session pointer
            await Session.findOneAndUpdate(
                { refreshTokenId: oldRefreshToken._id },
                {
                    refreshTokenId: newDbToken._id,
                    lastActivityAt: Date.now()
                }
            );
        }

        res.status(200).json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: accessTokenTtl,
            refresh_token: newRefreshTokenStr,
            ...(idToken && { id_token: idToken })
        });

    } catch (error) {
        console.error("TOKEN ENDPOINT CRASH");
        console.error(error);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Get User Info (OIDC standard)
// @route   GET /api/oauth/userinfo
// @access  Private (Bearer token)
exports.userinfo = async (req, res) => {
    try {
        const user = await User.findOne({
            tenantId: req.tenant._id, _id: req.user.id, tenantId: req.tenant._id
        });
        const { roles, permissions } = await resolveUserPermissions(user._id);

        console.log("USERINFO RESPONSE", {
            user: {
                sub: user._id.toString(),
                id: user._id.toString(), // Required for SDK backward compatibility
                email: user.email,
                email_verified: true,
                given_name: user.firstName,
                family_name: user.lastName,
                name: `${user.firstName} ${user.lastName}`, // Required for SDK
                tenantId: req.tenant._id, // Required for SDK
            },
            roles,
            permissions
        });

        res.status(200).json({
            user: {
                sub: user._id.toString(),
                id: user._id.toString(), // Required for SDK backward compatibility
                email: user.email,
                email_verified: true,
                given_name: user.firstName,
                family_name: user.lastName,
                name: `${user.firstName} ${user.lastName}`, // Required for SDK
                tenantId: req.tenant._id, // Required for SDK
            },
            roles,
            permissions
        });
    } catch (error) {
        res.status(500).json({ error: "server_error", error_description: error.message });
    }
};

// @desc    OIDC Discovery Endpoint
// @route   GET /.well-known/openid-configuration
// @access  Public
exports.discovery = (req, res) => {
    const issuer = process.env.OIDC_ISSUER || "http://localhost:5011";
    res.status(200).json({
        issuer,
        authorization_endpoint: `${issuer}/api/oauth/authorize`,
        token_endpoint: `${issuer}/api/oauth/token`,
        userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        end_session_endpoint: `${issuer}/api/oauth/end-session`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        scopes_supported: ["openid", "profile", "email"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
        claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "given_name", "family_name", "roles", "permissions"]
    });
};

// @desc    JWKS Endpoint
// @route   GET /.well-known/jwks.json
// @access  Public
exports.jwks = (req, res) => {
    if (!process.env.OIDC_PUBLIC_KEY) {
        return res.status(404).json({ error: "jwks_not_configured" });
    }

    const publicKey = process.env.OIDC_PUBLIC_KEY.replace(/\\n/g, "\n");
    // Convert PEM to JWK format
    const keyObject = crypto.createPublicKey(publicKey);
    const jwk = keyObject.export({ format: "jwk" });

    res.status(200).json({
        keys: [
            {
                kty: jwk.kty,
                n: jwk.n,
                e: jwk.e,
                alg: "RS256",
                kid: "sig-1",
                use: "sig"
            }
        ]
    });
};

// @desc    OIDC End Session (Logout)
// @route   GET /api/oauth/end-session
// @access  Public
exports.endSession = async (req, res) => {
    const { id_token_hint, post_logout_redirect_uri } = req.query;

    // Ideally, we validate the id_token_hint to verify the user
    // Then we kill the local IdP session (if using cookies for IdP SSO)
    // Then we trigger back-channel logout to all other connected apps

    auditService.logSsoEvent(req, auditEvents.SSO_LOGOUT, null, { postLogoutRedirectUri: post_logout_redirect_uri });

    // Redirect user back to RP application
    if (post_logout_redirect_uri) {
        // Validate post_logout_redirect_uri against registered Application postLogoutRedirectUris
        return res.redirect(post_logout_redirect_uri);
    }

    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc    Revoke Token
// @route   POST /api/oauth/revoke
// @access  Public
exports.revoke = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "invalid_request", error_description: "Token is required" });
        }

        // Ideally, we would add the token to a blacklist or delete it from the DB.
        // For JWTs, we can't easily invalidate without a blocklist.
        // If we implement refresh tokens in the DB, we would delete it here.

        auditService.logSsoEvent(req, auditEvents.SSO_LOGOUT, null, { action: "revoke_token" });

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "server_error", error_description: error.message });
    }
};
