const Application = require("../models/Application");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");
const corsManager = require("../middleware/dynamicCors");

// ==============================
// Create Application
// ==============================
exports.createApplication = async (req, res) => {
    try {
        const { 
            name, code, version, frontendUrl, backendUrl, status,
            redirectUris, postLogoutRedirectUris, scopes, grantTypes, clientType, clientId: providedClientId,
            allowedOrigins, metadata
        } = req.body;

        // Backend Validation
        if (!name || !code || !version || !frontendUrl || !backendUrl) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        // Auto Generate Client ID strictly
        const clientId = `gaxis_client_${crypto.randomBytes(12).toString("hex")}`;

        // Auto Generate Client Secret
        const plainSecret = crypto.randomBytes(32).toString("hex");
        
        // Hash the secret
        const salt = await bcrypt.genSalt(10);
        const hashedSecret = await bcrypt.hash(plainSecret, salt);

        let origins = allowedOrigins || [];
        if (origins.length === 0 && frontendUrl) {
            try {
                origins = [new URL(frontendUrl).origin];
            } catch (e) {
                // Ignore invalid URL parsing for frontendUrl
            }
        }

        // Create application
        const application = await Application.create({
            tenantId: req.tenant._id,
            ownerId: req.user._id,
            name,
            code,
            version,
            frontendUrl,
            backendUrl,
            status: status || "active",
            clientId,
            clientSecretHash: hashedSecret, // updated to match schema (clientSecretHash instead of clientSecret)
            redirectUris: redirectUris || [],
            postLogoutRedirectUris: postLogoutRedirectUris || [],
            allowedOrigins: [frontendUrl],
            scopes: scopes || ["openid", "profile", "email"],
            grantTypes: grantTypes || ["authorization_code", "refresh_token"],
            clientType: clientType || "public",
            allowedOrigins: origins,
            metadata: metadata || {}
        });

        const appResponse = application.toObject();
        appResponse.plainClientSecret = plainSecret; // NEVER saved in DB, only returned ONCE
        delete appResponse.clientSecretHash; // Don't return the hashed version

        // Refresh dynamic CORS to include this new application's origins
        corsManager.refreshOrigins();

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_CREATED,
            category: "Applications",
            resourceType: "Application",
            resourceId: application._id,
            metadata: { name: application.name, code: application.code }
        });

        res.status(201).json({
            success: true,
            data: appResponse,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Application code or Client ID already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==============================
// Get All Applications
// ==============================
exports.getApplications = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        
        const query = {};

        // Search by name or code
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Pagination setup
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const startIndex = (pageNumber - 1) * limitNumber;

        const total = await Application.countDocuments(query);

        // Execute query
        const applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limitNumber)
            .select("-clientSecret"); // Never return hashed secrets

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: pageNumber,
                pages: Math.ceil(total / limitNumber),
                limit: limitNumber
            },
            data: applications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==============================
// Get Single Application
// ==============================
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findOne({
            tenantId: req.tenant._id, _id: req.params.id, tenantId: req.tenant._id }).select("-clientSecret");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        res.status(200).json({
            success: true,
            data: application,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==============================
// Update Application
// ==============================
exports.updateApplication = async (req, res) => {
    try {
        // Prevent editing sensitive auto-generated fields
        const updateData = { ...req.body };
        delete updateData.clientId;
        delete updateData.clientSecretHash;
        delete updateData.secretRotatedAt;

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).select("-clientSecret");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_UPDATED,
            category: "Applications",
            resourceType: "Application",
            resourceId: application._id,
            metadata: updateData
        });

        // Refresh dynamic CORS in case URL changed
        corsManager.refreshOrigins();

        res.status(200).json({
            success: true,
            data: application,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Application code already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==============================
// Delete Application
// ==============================
exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_DELETED,
            category: "Applications",
            resourceType: "Application",
            resourceId: application._id,
            metadata: { name: application.name, code: application.code }
        });

        // Refresh dynamic CORS
        corsManager.refreshOrigins();

        res.status(200).json({
            success: true,
            message: "Application deleted successfully",
            data: { _id: application._id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==============================
// Update Application Status
// ==============================
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select("-clientSecret");

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_UPDATED,
            category: "Applications",
            resourceType: "Application",
            resourceId: application._id,
            metadata: { status }
        });

        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};



// ==============================
// Rotate Client Secret
// ==============================
exports.rotateClientSecret = async (req, res) => {
    try {
        const application = await Application.findOne({
            tenantId: req.tenant._id, _id: req.params.id
        });

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const plainSecret = crypto.randomBytes(32).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const hashedSecret = await bcrypt.hash(plainSecret, salt);

        application.clientSecretHash = hashedSecret;
        application.secretRotatedAt = new Date();
        await application.save();

        auditService.logEvent({
            req,
            action: auditEvents.APPLICATION_UPDATED,
            category: "Applications",
            resourceType: "Application",
            resourceId: application._id,
            metadata: { event: "secret_rotated" }
        });

        res.status(200).json({
            success: true,
            data: {
                plainClientSecret: plainSecret
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// Get SDK Configuration
// ==============================
exports.getSdkConfiguration = async (req, res) => {
    try {
        const application = await Application.findOne({
            tenantId: req.tenant._id, _id: req.params.id
        });

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const framework = req.query.framework || application.metadata?.framework || "react";
        const gaxisUrl = `${req.protocol}://${req.get('host')}`;
        const redirectUri = application.redirectUris.length > 0 ? application.redirectUris[0] : `${application.frontendUrl}/auth/callback`;

        let config = {};

        if (framework === "react") {
            config = {
                env: `VITE_GAXIS_URL=${gaxisUrl}\nVITE_GAXIS_CLIENT_ID=${application.clientId}\nVITE_GAXIS_REDIRECT_URI=${redirectUri}`,
                npm: "npm install gaxis-client-js gaxis-react",
                react: `import { GAxisProvider } from 'gaxis-react';\n\nconst gaxisConfig = {\n  clientId: import.meta.env.VITE_GAXIS_CLIENT_ID,\n  baseUrl: import.meta.env.VITE_GAXIS_URL,\n  redirectUri: import.meta.env.VITE_GAXIS_REDIRECT_URI\n};\n\n<GAxisProvider config={gaxisConfig}>\n  <App />\n</GAxisProvider>`
            };
        } else if (framework === "node") {
             config = {
                env: `GAXIS_URL=${gaxisUrl}\nGAXIS_CLIENT_ID=${application.clientId}\n# Remember to securely provide your client secret\nGAXIS_CLIENT_SECRET=YOUR_CLIENT_SECRET\nGAXIS_REDIRECT_URI=${redirectUri}`,
                npm: "npm install gaxis-node",
                react: `const { GAxisClient } = require('gaxis-node');\n\nconst client = new GAxisClient({\n  url: process.env.GAXIS_URL,\n  clientId: process.env.GAXIS_CLIENT_ID,\n  clientSecret: process.env.GAXIS_CLIENT_SECRET\n});\n\n// Protect routes middleware\napp.use('/api', client.protect());`
            };
        } else {
             config = {
                env: `GAXIS_URL=${gaxisUrl}\nGAXIS_CLIENT_ID=${application.clientId}`,
                npm: "npm install gaxis-js",
                react: `import { GAxisClient } from 'gaxis-js';\n\nconst client = new GAxisClient({\n  url: '${gaxisUrl}',\n  clientId: '${application.clientId}'\n});`
            };
        }

        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};