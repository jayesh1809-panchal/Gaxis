const express = require("express");
const router = express.Router();
const apiGatewayController = require("../controllers/apiGatewayController");
const { validateApiKey } = require("../services/apiGatewayService");
const { protect } = require("../middleware/auth");

// Public endpoint to test webhook dispatching internally for developers
router.post("/simulate-webhook", protect, apiGatewayController.simulateWebhookEvent);

// Developer portal usage analytics
router.get("/applications/:applicationId/usage", protect, apiGatewayController.getUsageAnalytics);

// The actual Gateway Entry (External APIs)
// Requires X-API-KEY header instead of JWT
router.get("/external/health", validateApiKey, apiGatewayController.healthCheck);

module.exports = router;
