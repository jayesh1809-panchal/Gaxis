const mongoose = require("mongoose");

const userRoleSchema = new mongoose.Schema(
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
        roleId: {
            type: mongoose.Schema.ObjectId,
            ref: "Role",
            required: [true, "Role ID is required"],
        },
        status: {
            type: String,
            enum: ["active", "revoked"],
            default: "active",
        },
        assignedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            default: null, // Optional for now, to be strict post-Auth
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate assignment of the same role to the same user
userRoleSchema.index({ userId: 1, roleId: 1 }, { });
userRoleSchema.index({ userId: 1 });
userRoleSchema.index({ roleId: 1 });

module.exports = mongoose.model("UserRole", userRoleSchema);
