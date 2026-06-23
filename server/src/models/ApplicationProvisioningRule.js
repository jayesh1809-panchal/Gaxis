const mongoose = require("mongoose");

const applicationProvisioningRuleSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        applicationId: {
            type: mongoose.Schema.ObjectId,
            ref: "Application",
            required: [true, "Application ID is required"],
            unique: true,
        },
        autoCreateUser: {
            type: Boolean,
            default: false,
        },
        syncProfile: {
            type: Boolean,
            default: true,
        },
        syncRoles: {
            type: Boolean,
            default: true,
        },
        defaultRole: {
            type: String,
            trim: true,
            uppercase: true,
            default: "EMPLOYEE",
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
applicationProvisioningRuleSchema.index({ tenantId: 1, applicationId: 1 }, { unique: true });

module.exports = mongoose.model("ApplicationProvisioningRule", applicationProvisioningRuleSchema);
