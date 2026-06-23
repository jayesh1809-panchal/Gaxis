const express = require("express");
const marketplaceController = require("../controllers/marketplaceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, marketplaceController.publishApplication);
router.post("/:id/package", protect, marketplaceController.updatePackage);

module.exports = router;
