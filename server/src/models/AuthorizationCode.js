const mongoose = require("mongoose");

const authorizationCodeSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
            },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        clientId: {
            type: String,
            required: true,
        },
        redirectUri: {
            type: String,
            required: true,
        },
        scopes: {
            type: [String],
            default: [],
        },
        codeChallenge: {
            type: String,
            required: true,
        },
        codeChallengeMethod: {
            type: String,
            enum: ["S256", "plain"],
            default: "S256",
        },
        nonce: {
            type: String,
        },
        used: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to automatically delete expired codes
authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


authorizationCodeSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("AuthorizationCode", authorizationCodeSchema);
