const mongoose = require("mongoose");

const applicationPackageSchema = new mongoose.Schema(
    {
        marketplaceAppId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MarketplaceApplication",
            required: true,
            unique: true,
        },
        redirectUris: {
            type: [String],
            default: [],
        },
        postLogoutRedirectUris: {
            type: [String],
            default: [],
        },
        clientType: {
            type: String,
            enum: ["public", "confidential"],
            default: "public",
        },
        defaultRoles: [
            {
                name: String,
                code: String,
                description: String,
            }
        ],
        defaultPermissions: [
            {
                name: String,
                code: String,
                resource: String,
                action: String,
                description: String,
            }
        ],
        defaultProvisioningRules: [
            {
                roleCode: String,
                mappedGroups: [String],
                autoProvision: Boolean,
            }
        ],
        setupSteps: [
            {
                stepName: String,
                description: String,
            }
        ]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ApplicationPackage", applicationPackageSchema);
