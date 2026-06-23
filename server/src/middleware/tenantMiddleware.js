const Tenant = require("../models/Tenant");
const jwt = require("jsonwebtoken");

const tenantMiddleware = async (req, res, next) => {
    try {
        let tenantId = null;

        // Priority 1: From Header (explicit override, useful for Super Admin switching)
        if (req.headers['x-tenant-id']) {
            tenantId = req.headers['x-tenant-id'];
        }
        // Priority 2: From JWT Header (since this runs before auth middleware)
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            const token = req.headers.authorization.split(" ")[1];
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.tenantId) {
                    tenantId = decoded.tenantId;
                }
            } catch (err) {
                // Ignore token errors here, authMiddleware will handle them later
            }
        }  
        // Priority 3: From Subdomain (Optional / Future-proofing)
        else {
            const host = req.get('host');
            if (host) {
                const subdomain = host.split('.')[0];
                if (!['api', 'localhost', 'www', '127'].includes(subdomain)) {
                    const tenant = await Tenant.findOne({ slug: subdomain, status: 'active' });
                    if (tenant) tenantId = tenant._id;
                }
            }
        }

        // Priority 4: Fallback to DEFAULT_TENANT (Crucial for local dev / unauthenticated requests)
        if (!tenantId) {
            const defaultTenant = await Tenant.findOne({ code: 'DEFAULT' });
            if (defaultTenant) {
                tenantId = defaultTenant._id;
            }
        }

        if (!tenantId) {
            return res.status(400).json({ success: false, message: "Tenant identification missing." });
        }

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found." });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({ success: false, message: "Tenant is suspended." });
        }

        // Expose tenant on request object
        req.tenant = tenant;
        next();
    } catch (error) {
        console.error("Tenant Middleware Error:", error);
        res.status(500).json({ success: false, message: "Failed to resolve tenant." });
    }
};

module.exports = tenantMiddleware;
