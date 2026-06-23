const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { protect, authorize } = require("../middleware/auth");

// GET /api/audit-logs
router.route("/")
    .get(protect, authorize("audit_logs.read"), auditController.getAuditLogs);

// GET /api/audit-logs/:id
router.route("/:id")
    .get(protect, authorize("audit_logs.read"), auditController.getAuditLogById);

module.exports = router;
