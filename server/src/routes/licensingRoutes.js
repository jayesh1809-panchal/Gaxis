const express = require('express');
const licensingController = require('../controllers/licensingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my-licenses', protect, licensingController.getMyLicenses);
router.get('/verify/:marketplaceAppId', protect, licensingController.verifyLicense);

module.exports = router;
