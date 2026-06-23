const express = require("express");
const router = express.Router();
const governanceController = require("../controllers/governanceController");
const { protect } = require("../middleware/auth");

// Organization Units
router.route("/org-units")
    .get(protect, governanceController.getOrganizationUnits)
    .post(protect, governanceController.createOrganizationUnit);

router.route("/org-units/:id")
    .put(protect, governanceController.updateOrganizationUnit)
    .delete(protect, governanceController.deleteOrganizationUnit);

// Governance Policies
router.route("/policies")
    .get(protect, governanceController.getPolicies)
    .post(protect, governanceController.createPolicy);

router.route("/policies/:id")
    .put(protect, governanceController.updatePolicy)
    .delete(protect, governanceController.deletePolicy);

// Approval Workflows
router.route("/workflows")
    .get(protect, governanceController.getApprovalWorkflows)
    .post(protect, governanceController.createApprovalWorkflow);

router.route("/workflows/:id")
    .put(protect, governanceController.updateApprovalWorkflow)
    .delete(protect, governanceController.deleteApprovalWorkflow);

// Approval Requests
router.route("/requests")
    .get(protect, governanceController.getApprovalRequests);

router.route("/requests/:id")
    .get(protect, governanceController.getApprovalRequestById);

router.route("/requests/:id/review")
    .post(protect, governanceController.reviewApprovalRequest);

// Delegated Admins
router.route("/delegated-admins")
    .get(protect, governanceController.getDelegatedAdmins)
    .post(protect, governanceController.assignDelegatedAdmin);

router.route("/delegated-admins/:id")
    .delete(protect, governanceController.revokeDelegatedAdmin);

// Compliance Dashboard & Reviews
router.route("/compliance/records")
    .get(protect, governanceController.getComplianceRecords)
    .post(protect, governanceController.createComplianceRecord);

router.route("/compliance/records/:id/review")
    .put(protect, governanceController.reviewComplianceRecord);

router.route("/compliance/metrics")
    .get(protect, governanceController.getComplianceMetrics);

module.exports = router;
