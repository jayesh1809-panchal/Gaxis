const express = require("express");
const eventBusController = require("../controllers/eventBusController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/events", eventBusController.getEvents);

router.route("/subscriptions")
    .get(eventBusController.getSubscriptions)
    .post(eventBusController.createSubscription);

router.delete("/subscriptions/:id", eventBusController.deleteSubscription);

router.get("/deliveries", eventBusController.getDeliveries);

router.get("/dlq", eventBusController.getDeadLetters);
router.post("/dlq/:id/replay", eventBusController.replayDeadLetter);

module.exports = router;
