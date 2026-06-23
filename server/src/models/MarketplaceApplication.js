const mongoose = require("mongoose");

const marketplaceApplicationSchema = new mongoose.Schema(
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
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        version: {
            type: String,
            required: true,
            default: "1.0.0",
        },
        icon: {
            type: String,
        },
        screenshots: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["draft", "published", "deprecated"],
            default: "draft",
        },
        publisherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("MarketplaceApplication", marketplaceApplicationSchema);
