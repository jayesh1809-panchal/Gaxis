const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        enum: ["AWS", "GCP", "AZURE", "ON-PREM"],
        default: "AWS"
    },
    status: {
        type: String,
        enum: ["active", "inactive", "maintenance", "isolated"],
        default: "active"
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    capacityLimits: {
        maxComputeNodes: { type: Number, default: 100 },
        maxStorageGb: { type: Number, default: 10000 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Region", regionSchema);
