const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Permission name is required"],
            trim: true,
            minlength: [2, "Permission name must be at least 2 characters"],
            maxlength: [50, "Permission name cannot exceed 50 characters"],
        },
        code: {
            type: String,
            required: [true, "Permission code is required"],
            trim: true,
            lowercase: true,
            match: [
                /^[a-z_]+\.[a-z_]+$/,
                "Permission code must follow resource.action format (e.g., users.read)",
            ],
        },
        module: {
            type: String,
            required: [true, "Module is required"],
            enum: [
                "APPLICATIONS",
                "USERS",
                "ROLES",
                "PERMISSIONS",
                "SESSIONS",
                "AUDIT_LOGS",
                "SETTINGS",
            ],
        },
        description: {
            type: String,
            maxlength: [250, "Description cannot exceed 250 characters"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        isSystemPermission: {
            type: Boolean,
            default: false,
        },
        permissionScope: {
            type: String,
            enum: ["SYSTEM", "APPLICATION"],
            required: [true, "Permission scope is required"],
        },
        applicationId: {
            type: mongoose.Schema.ObjectId,
            ref: "Application",
            default: null, // Null for SYSTEM scope, ObjectId for APPLICATION scope
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to normalize code to lowercase
permissionSchema.pre("save", function (next) {
    if (this.isModified("code") && this.code) {
        this.code = this.code.toLowerCase().replace(/\s+/g, "");
    }
    if (typeof next === "function") {
        next();
    }
});

// Pre-findOneAndUpdate hook to normalize code on updates
permissionSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update && update.code) {
        update.code = update.code.toLowerCase().replace(/\s+/g, "");
    }
    if (typeof next === "function") {
        next();
    }
});

// Indexes for searching and filtering (unique indexes are handled in the schema definition)
permissionSchema.index({ module: 1 });
permissionSchema.index({ status: 1 });
permissionSchema.index({ isSystemPermission: 1 });
permissionSchema.index({ permissionScope: 1 });
permissionSchema.index({ name: "text", code: "text", description: "text" });


permissionSchema.index({ tenantId: 1, name: 1 }, { unique: true });
permissionSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Permission", permissionSchema);
