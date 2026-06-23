const express = require("express");
const router = express.Router();
const oauthController = require("../controllers/oauthController");
const { protect } = require("../middleware/auth");

// OIDC / OAuth2 Endpoints
router.get("/authorize", oauthController.authorize);
router.post("/token", oauthController.token);
router.get("/userinfo", protect, oauthController.userinfo);
router.post("/revoke", oauthController.revoke);
router.get("/end-session", oauthController.endSession);

module.exports = router;
