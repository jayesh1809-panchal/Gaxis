const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        roleId: {
            type: mongoose.Schema.ObjectId,
            ref: "Role",
            required: [true, "Role ID is required"],
        },
        permissionId: {
            type: mongoose.Schema.ObjectId,
            ref: "Permission",
            required: [true, "Permission ID is required"],
        },
        status: {
            type: String,
            enum: ["active", "revoked"],
            default: "active",
        },
        assignedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            default: null, // Optional for now, to be strictly populated in Phase 6 Auth
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate assignment of the same permission to the same role
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { });
rolePermissionSchema.index({ roleId: 1 });
rolePermissionSchema.index({ permissionId: 1 });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
