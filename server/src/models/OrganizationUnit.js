const mongoose = require("mongoose");

const organizationUnitSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Code is required"],
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            enum: ["ORGANIZATION", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "TEAM"],
            required: [true, "Type is required"],
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationUnit",
            default: null,
            index: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

organizationUnitSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("OrganizationUnit", organizationUnitSchema);
