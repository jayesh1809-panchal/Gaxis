const mongoose = require("mongoose");

const delegatedAdminSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        adminRole: {
            type: String,
            required: true,
            enum: [
                "GLOBAL_ADMIN",
                "TENANT_ADMIN",
                "BUSINESS_UNIT_ADMIN",
                "DEPARTMENT_ADMIN",
                "APPLICATION_ADMIN",
                "SECURITY_ADMIN",
                "AUDIT_ADMIN",
            ],
        },
        scopeType: {
            type: String,
            enum: ["ALL", "ORGANIZATION_UNIT", "APPLICATION"],
            required: true,
        },
        scopeId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // References either OrganizationUnit or Application
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

delegatedAdminSchema.index(
    { tenantId: 1, userId: 1, adminRole: 1, scopeType: 1, scopeId: 1 },
    { unique: true }
);

module.exports = mongoose.model("DelegatedAdmin", delegatedAdminSchema);
