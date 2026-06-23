const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Role name is required"],
            trim: true,
            minlength: [2, "Role name must be at least 2 characters"],
            maxlength: [50, "Role name cannot exceed 50 characters"],
        },
        code: {
            type: String,
            required: [true, "Role code is required"],
            trim: true,
            uppercase: true, // Will normalize code to uppercase automatically by Mongoose
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
        isSystemRole: {
            type: Boolean,
            default: false,
        },
        roleType: {
            type: String,
            enum: ["SYSTEM", "APPLICATION"],
            required: [true, "Role type is required"],
        },
        applicationId: {
            type: mongoose.Schema.ObjectId,
            ref: "Application",
            default: null, // Null for SYSTEM roles, ObjectId for APPLICATION roles
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to normalize code (replace spaces with underscores)
roleSchema.pre("save", function (next) {
    if (this.isModified("code") && this.code) {
        // Replace spaces with underscores
        this.code = this.code.replace(/\s+/g, "_");
    }
    if (typeof next === "function") {
        next();
    }
});

// Pre-findOneAndUpdate hook to normalize code on updates
roleSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update && update.code) {
        // Uppercase and replace spaces with underscores
        update.code = update.code.toUpperCase().replace(/\s+/g, "_");
    }
    if (typeof next === "function") {
        next();
    }
});

// Indexes for searching and filtering (unique indexes are handled in the schema definition)
roleSchema.index({ status: 1 });
roleSchema.index({ isSystemRole: 1 });
roleSchema.index({ roleType: 1 });
roleSchema.index({ name: "text", code: "text", description: "text" });


roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
