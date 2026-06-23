const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
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
        refreshTokenId: {
            type: mongoose.Schema.ObjectId,
            ref: "RefreshToken",
            required: true,
        },
        deviceInfo: {
            type: String, // e.g., "iPhone 14", "MacBook Pro"
        },
        browser: {
            type: String, // e.g., "Chrome 115"
        },
        operatingSystem: {
            type: String, // e.g., "Windows 11", "iOS 16"
        },
        ipAddress: {
            type: String,
        },
        location: {
            country: String,
            city: String,
        },
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "revoked", "expired"],
            default: "active",
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

// Indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ refreshTokenId: 1 });
// TTL Index to automatically remove expired sessions after 7 days
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);
