const express = require("express");
const router = express.Router();
const apiMarketplaceController = require("../controllers/apiMarketplaceController");
const { protect } = require("../middleware/auth");

// Public Discovery Routes (can be accessed without auth for browsing)
router.get("/discover", apiMarketplaceController.discoverProducts);
router.get("/products/:id", apiMarketplaceController.getProductDetails);

// Protected Consumer Routes
router.use(protect);
router.post("/subscribe", apiMarketplaceController.subscribe);
router.get("/my-subscriptions", apiMarketplaceController.getMySubscriptions);

module.exports = router;
