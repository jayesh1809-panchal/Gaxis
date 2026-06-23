const express = require("express");
const router = express.Router();
const securityController = require("../controllers/securityController");
const { protect } = require("../middleware/auth");
// All these routes are prefixed with /api/security
router.use(protect);

router.route("/applications/:id/credentials")
    .get(securityController.getCredentials);

router.route("/applications/:id/credentials/rotate")
    .post(securityController.rotateSecret);

router.route("/applications/:id/policies")
    .get(securityController.getPolicies)
    .put(securityController.updatePolicies);

router.route("/applications/:id/sessions")
    .get(securityController.getSessions);

router.route("/applications/:id/sessions/:sessionId")
    .delete(securityController.revokeSession);

module.exports = router;
