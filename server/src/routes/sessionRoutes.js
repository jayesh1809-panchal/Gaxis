const express = require("express");
const {
    getMySessions,
    getSession,
    revokeSession,
    revokeAllSessions,
    forceRevokeSession
} = require("../controllers/sessionController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// User endpoints
router.delete("/logout-all", revokeAllSessions); // Place before /:id

router
    .route("/")
    .get(getMySessions);

router
    .route("/:id")
    .get(getSession)
    .delete(revokeSession);

// Admin endpoints
router.delete("/force/:id", authorize("sessions.delete"), forceRevokeSession);

module.exports = router;
