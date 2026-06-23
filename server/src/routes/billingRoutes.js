const express = require('express');
const billingController = require('../controllers/billingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/account', protect, billingController.getBillingAccount);
router.post('/account', protect, billingController.updateBillingAccount);
router.get('/invoices', protect, billingController.getInvoices);
router.get('/payments', protect, billingController.getPayments);
router.post('/invoices/:id/pay', protect, billingController.payInvoice);
router.post('/trigger-cycle', protect, billingController.triggerBillingCycle);

module.exports = router;
