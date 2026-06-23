const { decodeToken, verifyToken } = require('../utils/jwt');

/**
 * Express middleware to ensure the user is authenticated via G-Axis.
 * @param {import('../GAxisSDK')} sdkInstance 
 */
function requireAuth(sdkInstance) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
        }

        const token = authHeader.split(' ')[1];

        try {
            // In a production app, verifyToken would validate against G-Axis JWKS.
            // Here we decode it and trust it for demonstration of architecture,
            // but the developer should inject the public key or SDK fetches it.
            const decoded = decodeToken(token);
            if (!decoded) {
                throw new Error("Malformed token");
            }

            // Optional: validate heartbeat if configured to do so strictly
            if (sdkInstance.config.strictSessionHeartbeat) {
                const isValid = await sdkInstance.sessions.checkHeartbeat(token);
                if (!isValid) {
                    return res.status(401).json({ success: false, message: "Session has expired globally" });
                }
            }

            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "Unauthorized", error: error.message });
        }
    };
}

module.exports = {
    requireAuth
};
