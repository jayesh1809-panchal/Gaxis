const mongoose = require("mongoose");

const apiMarketplaceProductSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "APIProvider", required: true },
    name: { type: String, required: true },
    version: { type: String, default: "1.0.0" },
    description: { type: String },
    category: { 
        type: String, 
        enum: ["Authentication", "Analytics", "Workflow", "HRMS", "CRM", "Projects", "Visitor", "Assets", "AI", "Notifications", "Payments", "Custom"], 
        required: true 
    },
    tags: [{ type: String }],
    status: { type: String, enum: ["draft", "published", "deprecated"], default: "draft" },
    documentationUrl: { type: String },
    swaggerSpec: { type: Object }, // Embedded OpenAPI Spec
    baseEndpoint: { type: String, required: true }, // e.g. /api/public/v1/weather
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    subscriberCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("APIMarketplaceProduct", apiMarketplaceProductSchema);
