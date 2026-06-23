const express = require("express");
const {
    setupMfa,
    verifySetup,
    disableMfa,
    regenerateBackupCodes
} = require("../controllers/mfaController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All MFA management endpoints require existing standard authentication

router.post("/setup", setupMfa);
router.post("/verify-setup", verifySetup);
router.post("/disable", disableMfa);
router.post("/backup-codes", regenerateBackupCodes);

module.exports = router;
