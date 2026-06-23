const express = require("express");

const {
    provisionUser,
    getProvisioningRule,
    upsertProvisioningRule,
} = require("../controllers/provisioningController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Provision User (this endpoint might be called internally or via SDK backend with valid token)
router.post("/user", protect, provisionUser);

// Provisioning Rule Management
router
    .route("/rules/:applicationId")
    .get(protect, authorize("applications.read"), getProvisioningRule)
    .put(protect, authorize("applications.update"), upsertProvisioningRule);

module.exports = router;
