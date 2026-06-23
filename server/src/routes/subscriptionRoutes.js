const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Tenant Admin / Public Routes
router.get("/plans/:marketplaceAppId", protect, subscriptionController.getPlans);
router.get("/my-subscriptions", protect, subscriptionController.getMySubscriptions);
router.post("/subscribe", protect, subscriptionController.subscribe);
router.get("/usage/:marketplaceAppId", protect, subscriptionController.getUsage);
router.post("/usage/report", protect, subscriptionController.reportUsage);
router.get("/verify/:marketplaceAppId", protect, subscriptionController.verifyFeature);

module.exports = router;
