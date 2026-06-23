const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

// All AI routes require authentication
router.use(protect);

// Assistant Chat
router.post("/query", (req, res, next) => { console.log("AI ROUTE HIT"); next(); }, authorize("ai.query"), aiController.sendMessage);

// Actions
router.post("/actions/:actionId/execute", authorize("ai.actions.execute"), aiController.executeAction);

// Conversations
router.get("/conversations", aiController.getConversations);
router.get("/conversations/:id", aiController.getConversationById);

// Execution Logs (Admin only)
router.get("/logs", authorize("ai.logs.read"), aiController.getExecutionLogs);

module.exports = router;
