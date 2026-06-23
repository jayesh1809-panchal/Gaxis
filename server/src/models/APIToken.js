const mongoose = require("mongoose");

const apiTokenSchema = new mongoose.Schema({
    developerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperAccount",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["bearer", "oauth"],
        default: "bearer"
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("APIToken", apiTokenSchema);
