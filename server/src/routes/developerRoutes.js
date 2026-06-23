const express = require("express");
const router = express.Router();
const developerController = require("../controllers/developerController");
const { protect } = require("../middleware/auth");

// All routes protected by standard user auth (the developer's portal identity)
router.use(protect);

router.get("/profile", developerController.getDeveloperProfile);
router.get("/applications", developerController.getApplications);
router.post("/applications", developerController.createApplication);
router.get("/api-products", developerController.getApiProducts);
router.get("/applications/:applicationId/keys", developerController.getApiKeys);
router.post("/keys", developerController.createApiKey);
router.post("/webhooks", developerController.registerWebhook);
router.get("/sdks", developerController.getSDKs);

module.exports = router;
