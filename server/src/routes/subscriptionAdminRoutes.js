const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/plans", protect, subscriptionController.createPlan);
router.put("/plans/:id", protect, subscriptionController.updatePlan);

module.exports = router;
