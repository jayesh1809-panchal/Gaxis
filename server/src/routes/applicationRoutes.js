const express = require("express");

const {
    createApplication,
    getApplications,
    getApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
    getSdkConfiguration,
    rotateClientSecret,
} = require("../controllers/applicationController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All application routes require authentication
router.use(protect);

// =====================================
// Applications Routes
// =====================================

router
    .route("/")
    .get(authorize("applications.read"), getApplications)
    .post(authorize("applications.create"), createApplication);

router
    .route("/:id")
    .get(authorize("applications.read"), getApplication)
    .put(authorize("applications.update"), updateApplication)
    .delete(authorize("applications.delete"), deleteApplication);

router
    .route("/:id/status")
    .put(authorize("applications.update"), updateApplicationStatus);

router
    .route("/:id/rotate-secret")
    .post(authorize("applications.update"), rotateClientSecret);

router
    .route("/:id/sdk-config")
    .get(authorize("applications.read"), getSdkConfiguration);

module.exports = router;