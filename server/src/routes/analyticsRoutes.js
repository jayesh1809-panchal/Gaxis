const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/snapshot", analyticsController.getSnapshot);
router.get("/metrics", analyticsController.getMetrics);
router.get("/events", analyticsController.getRecentEvents);
router.get("/export", analyticsController.exportReport);

module.exports = router;
