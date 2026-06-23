const express = require("express");
const marketplaceController = require("../controllers/marketplaceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public / Tenant Admin Routes
router.get("/applications", protect, marketplaceController.getMarketplaceApplications);
router.get("/applications/:id", protect, marketplaceController.getMarketplaceApplicationDetails);
router.post("/applications/:id/install", protect, marketplaceController.installApplication);
router.post("/applications/:id/uninstall", protect, marketplaceController.uninstallApplication);
router.get("/installations", protect, marketplaceController.getInstalledApplications);

module.exports = router;
