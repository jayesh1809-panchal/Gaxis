const express = require("express");
const router = express.Router();
const oauthController = require("../controllers/oauthController");

// OIDC Discovery Endpoints
router.get("/openid-configuration", oauthController.discovery);
router.get("/jwks.json", oauthController.jwks);

module.exports = router;
