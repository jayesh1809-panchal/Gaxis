const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
        },
        familyId: {
            type: String, // UUID to track token lineage and detect reuse
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        revoked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ tokenHash: 1 });
// TTL Index to auto-delete expired tokens from DB after 7 days of expiry
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
