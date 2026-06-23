const mongoose = require("mongoose");

const userApplicationAccessSchema = new mongoose.Schema(
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
            required: [true, "User ID is required"],
        },
        applicationId: {
            type: mongoose.Schema.ObjectId,
            ref: "Application",
            required: [true, "Application ID is required"],
        },
        status: {
            type: String,
            enum: ["active", "revoked"],
            default: "active",
        },
        assignedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent assigning the same app to a user multiple times
userApplicationAccessSchema.index({ userId: 1, applicationId: 1 }, { });
// Fast query for all users in a specific app
userApplicationAccessSchema.index({ applicationId: 1 });

module.exports = mongoose.model("UserApplicationAccess", userApplicationAccessSchema);
