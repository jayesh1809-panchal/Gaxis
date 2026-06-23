const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            uppercase: true,
        },

        frontendUrl: {
            type: String,
            required: true,
        },

        backendUrl: {
            type: String,
            required: true,
        },

        version: {
            type: String,
            required: true,
        },

        description: {
            type: String,
        },
        url: {
            type: String,
            trim: true,
        },
        icon: {
            type: String, // URL or code for the icon
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        // OIDC / OAuth2 Client fields
        clientId: {
            type: String,
            sparse: true,
        },
        clientSecretHash: {
            type: String,
            select: false, // Don't return by default
        },
        clientType: {
            type: String,
            enum: ["public", "confidential"],
            default: "public",
        },
        redirectUris: {
            type: [String],
            default: [],
        },
        postLogoutRedirectUris: {
            type: [String],
            default: [],
        },
        allowedOrigins: {
            type: [String],
            default: [],
        },
        scopes: {
            type: [String],
            default: ["openid", "profile", "email"],
        },
        grantTypes: {
            type: [String],
            default: ["authorization_code", "refresh_token"],
        },
        allowedOrigins: {
            type: [String],
            default: [],
        },
        secretRotatedAt: {
            type: Date,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

applicationSchema.index({ tenantId: 1, code: 1 }, { unique: true });
applicationSchema.index({ tenantId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model(
    "Application",
    applicationSchema
);