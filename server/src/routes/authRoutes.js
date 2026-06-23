const express = require("express");
const { login, logout, logoutAll, refresh, verifyMfa } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/verify-mfa", verifyMfa);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);

module.exports = router;
