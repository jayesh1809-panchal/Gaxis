/**
 * Express middleware to ping G-Axis session heartbeat periodically.
 * This ensures local sessions don't stay alive if the global session is killed.
 * @param {import('../GAxisSDK')} sdkInstance 
 */
function sessionHeartbeat(sdkInstance) {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.split(' ')[1];
    try {
      const isValid = await sdkInstance.sessions.checkHeartbeat(token);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Session expired globally",
          code: "SESSION_TERMINATED"
        });
      }
      next();
    } catch (error) {
      // Fallback: allow request if heartbeat fails due to network, 
      // unless strict mode is enabled.
      next();
    }
  };
}
module.exports = {
  sessionHeartbeat
};