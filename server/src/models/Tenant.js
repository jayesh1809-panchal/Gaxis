const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        domain: {
            type: String,
            unique: true,
            sparse: true, // Allow nulls for tenants without custom domains
            trim: true,
        },
        logo: {
            type: String,
            default: null,
        },
        plan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "enterprise",
        },
        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
        settings: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
