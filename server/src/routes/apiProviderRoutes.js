const express = require("express");
const router = express.Router();
const apiProviderController = require("../controllers/apiProviderController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/register", apiProviderController.registerAsProvider);
router.post("/publish", apiProviderController.publishApi);
router.get("/dashboard", apiProviderController.getProviderDashboard);

module.exports = router;
