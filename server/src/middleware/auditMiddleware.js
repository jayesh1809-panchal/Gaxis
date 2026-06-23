/**
 * Utility to extract IP address from request, respecting proxies if configured
 */
exports.getIpAddress = (req) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return req.socket.remoteAddress || req.ip;
};

/**
 * Utility to extract User Agent from request
 */
exports.getUserAgent = (req) => {
    return req.headers['user-agent'] || 'Unknown';
};
