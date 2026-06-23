const mongoose = require("mongoose");

const apiProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    version: {
        type: String,
        required: true,
        default: "v1"
    },
    status: {
        type: String,
        enum: ["active", "deprecated", "retired"],
        default: "active"
    },
    endpoints: [{
        path: String,
        method: String,
        description: String,
        requiredScopes: [String]
    }],
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("APIProduct", apiProductSchema);
