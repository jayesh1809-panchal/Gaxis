const mongoose = require("mongoose");

const apiReviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "APIMarketplaceProduct", required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    helpfulVotes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("APIReview", apiReviewSchema);
