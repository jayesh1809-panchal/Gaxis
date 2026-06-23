const express = require('express');

/**
 * Express Provider
 * 
 * Phase 8.2: Integrates the OAuth Client Engine routing logic.
 * 
 * @param {import('../GAxisSDK')} sdkInstance 
 */
function expressProvider(sdkInstance, options = {}) {
    const router = express.Router();

    // 1. Initiate Login
    router.get('/login', async (req, res) => {
        try {
            // Generate Login URL and redirect
            const loginUrl = await sdkInstance.oauth.login();
            res.redirect(loginUrl);
        } catch (error) {
            sdkInstance.logger.error(`Login routing failed: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to initiate login." });
        }
    });

    // 2. Handle Callback
    router.get('/callback', async (req, res) => {
        const { code, state, error } = req.query;
        try {
            // Process callback (verifies PKCE, exchanges code for token, validates JWT)
            const tokenData = await sdkInstance.oauth.handleCallback(code, state, error);

            // Decode ID token to get claims (assuming jose is imported or we decode base64url)
            // For simplicity here, we assume TokenManager.validateIdToken returned the payload
            const idTokenPayload = await sdkInstance.oauth.token.validateIdToken(tokenData.id_token);

            // Phase 8.3: Provision User Locally
            const localUser = await sdkInstance.identity.provisionUser(idTokenPayload);

            // Phase 8.4: Trigger Auth Success Event with local mapping so Authz can sync
            sdkInstance.events.emitEvent(sdkInstance.events.events.AUTH_SUCCESS, {
                localUserId: localUser.id || localUser._id,
                tokenPayload: idTokenPayload
            });

            // Phase 8.5: Centralized Session Creation
            const session = await sdkInstance.session.createSession(localUser.id || localUser._id, req);

            // If frontend redirect is requested, set cookie and redirect
            if (options.successRedirect) {
                res.cookie("gaxis_session", session.sessionId, { httpOnly: false });
                res.cookie("gaxis_user", JSON.stringify(localUser), { httpOnly: false });
                return res.redirect(options.successRedirect);
            }

            // Respond with tokens, local user data, and the new sessionId
            res.json({ success: true, user: localUser, tokenData, sessionId: session.sessionId });
        } catch (err) {
            sdkInstance.logger.error(`Callback routing failed: ${err.message}`);
            res.status(400).json({ success: false, message: "Authentication failed.", error: err.message });
        }
    });

    // 3. Handle Logout
    router.post('/logout', async (req, res) => {
        try {
            // We're leaving idTokenHint and postLogoutRedirectUri empty for default behavior
            const logoutUrl = await sdkInstance.oauth.logout();
            if (logoutUrl) {
                res.redirect(logoutUrl);
            } else {
                res.json({ success: true, message: "Local logout processed." });
            }
        } catch (error) {
            sdkInstance.logger.error(`Logout routing failed: ${error.message}`);
            res.status(500).json({ success: false, message: "Logout failed." });
        }
    });

    // Phase 8.6: SLO Webhook Receiver
    router.post('/slo/receive', async (req, res) => {
        try {
            await sdkInstance.slo.receiveLogoutWebhook(req.body);
            res.json({ success: true, message: 'SLO Webhook processed.' });
        } catch (err) {
            sdkInstance.logger.error(`SLO Webhook processing failed: ${err.message}`);
            res.status(500).json({ error: 'SLO Error' });
        }
    });

    return router;
}

/**
 * Phase 8.6 Alias for requireSession, explicitly communicating that 
 * it rejects revoked sessions (which SLO does under the hood).
 */
expressProvider.requireActiveSession = (sdkInstance) => {
    return expressProvider.requireSession(sdkInstance);
};

/**
 * Express Middleware to require a specific local role.
 * @param {import('../GAxisSDK')} sdkInstance 
 * @param {string} localRole 
 */
expressProvider.requireRole = (sdkInstance, localRole) => {
    return async (req, res, next) => {
        // In a real app, req.user would be set by a session middleware
        const localUserId = req.user?.id || req.user?._id;
        if (!localUserId) return res.status(401).json({ error: "Unauthorized" });

        const hasRole = await sdkInstance.authz.hasRole(localUserId, localRole);
        if (!hasRole) {
            sdkInstance.logger.warn(`Access denied. Missing role: ${localRole}`);
            return res.status(403).json({ error: "Forbidden. Insufficient role." });
        }
        next();
    };
};

/**
 * Express Middleware to require a specific local permission.
 * @param {import('../GAxisSDK')} sdkInstance 
 * @param {string} localPermission 
 */
expressProvider.requirePermission = (sdkInstance, localPermission) => {
    return async (req, res, next) => {
        const localUserId = req.user?.id || req.user?._id;
        if (!localUserId) return res.status(401).json({ error: "Unauthorized" });

        const hasPerm = await sdkInstance.authz.hasPermission(localUserId, localPermission);
        if (!hasPerm) {
            sdkInstance.logger.warn(`Access denied. Missing permission: ${localPermission}`);
            return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
        }
        next();
    };
};

/**
 * Express Middleware to require a valid SDK session.
 * @param {import('../GAxisSDK')} sdkInstance 
 */
expressProvider.requireSession = (sdkInstance) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            const headerSessionId = req.headers['x-session-id'];
            
            let sessionId = headerSessionId;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                sessionId = authHeader.substring(7);
            }
            
            if (!sessionId) {
                return res.status(401).json({ error: "Unauthorized. Missing session ID." });
            }

            // Validate via Engine
            const session = await sdkInstance.session.validateSession(sessionId, req);

            // Attach user/session to req for downstream usage
            req.sessionData = session;
            req.user = { id: session.userId };

            next();
        } catch (error) {
            sdkInstance.logger.warn(`Session validation failed: ${error.message}`);
            return res.status(401).json({ error: "Unauthorized.", details: error.message });
        }
    };
};

module.exports = expressProvider;
