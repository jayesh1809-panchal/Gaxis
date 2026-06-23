const auditService = require('../services/auditService');

const errorHandler = async (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    console.error(err.stack);

    // Log to audit if it's a critical application error (optional, depending on requirements)
    if (req.user && err.statusCode >= 500) {
        try {
            await auditService.logEvent({
                actorUserId: req.user._id,
                actorEmail: req.user.email,
                action: 'SYSTEM_ERROR',
                category: 'System Settings',
                resourceType: 'Error',
                status: 'failed',
                metadata: { error: err.message, stack: err.stack, path: req.path },
                req
            });
        } catch (auditErr) {
            console.error('Failed to log error to audit:', auditErr);
        }
    }

    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: err.message || 'Server Error',
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
