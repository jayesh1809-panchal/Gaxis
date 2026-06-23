const express = require('express');
const revenueController = require('../controllers/revenueController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', protect, revenueController.getSuperAdminRevenue);
router.get('/publisher', protect, revenueController.getPublisherRevenue);

module.exports = router;
