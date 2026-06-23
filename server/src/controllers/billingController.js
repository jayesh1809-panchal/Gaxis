const BillingAccount = require('../models/BillingAccount');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const billingEngine = require('../services/billingEngine');
const paymentService = require('../services/paymentService');
const invoiceEngine = require('../services/invoiceEngine');

/**
 * Get or create Billing Account for tenant
 * GET /api/billing/account
 */
exports.getBillingAccount = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        const account = await BillingAccount.findOneAndUpdate(
            { tenantId },
            {
                $setOnInsert: {
                    billingEmail: req.user.email,
                    status: 'active',
                    currency: 'USD',
                    balance: 0
                }
            },
            { returnDocument: 'after', upsert: true }
        );
        
        res.json({ success: true, data: account });
    } catch (error) {
        console.error("Error getting billing account:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Billing Account
 * POST /api/billing/account
 */
exports.updateBillingAccount = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { billingEmail, paymentMethodDetails, currency } = req.body;

        let account = await BillingAccount.findOne({ tenantId });
        if (!account) {
            account = new BillingAccount({ tenantId });
        }

        if (billingEmail) account.billingEmail = billingEmail;
        if (paymentMethodDetails) account.paymentMethodDetails = paymentMethodDetails;
        if (currency) account.currency = currency;

        await account.save();
        res.json({ success: true, data: account });
    } catch (error) {
        console.error("Error updating billing account:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * List tenant's invoices
 * GET /api/billing/invoices
 */
exports.getInvoices = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { status } = req.query;
        
        const filter = { tenantId };
        if (status) filter.status = status;

        const invoices = await Invoice.find(filter)
            .populate('marketplaceAppId', 'name code icon')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error("Error listing invoices:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * List tenant's payments
 * GET /api/billing/payments
 */
exports.getPayments = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        // Find invoices for this tenant first
        const invoices = await Invoice.find({ tenantId });
        const invoiceIds = invoices.map(inv => inv._id);

        const payments = await Payment.find({ invoiceId: { $in: invoiceIds } })
            .populate({
                path: 'invoiceId',
                populate: { path: 'marketplaceAppId', select: 'name code' }
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: payments });
    } catch (error) {
        console.error("Error listing payments:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Pay outstanding invoice manually
 * POST /api/billing/invoices/:id/pay
 */
exports.payInvoice = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const { source } = req.body; // e.g. token or card status sim

        const invoice = await Invoice.findOne({ _id: id, tenantId });
        if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
        if (invoice.status === 'paid') return res.status(400).json({ success: false, message: "Invoice is already paid" });

        const gateway = paymentService.getProvider('mock');
        const chargeResult = await gateway.processPayment({
            amount: invoice.total,
            currency: 'USD',
            source: source || 'default_card'
        });

        if (chargeResult.success) {
            // Save Payment
            const payment = new Payment({
                invoiceId: invoice._id,
                amount: invoice.total,
                method: 'mock',
                reference: chargeResult.reference,
                status: 'completed',
                paidDate: new Date()
            });
            await payment.save();

            // Update Invoice Status
            await invoiceEngine.markAsPaid(invoice._id);

            res.json({ success: true, message: "Invoice paid successfully", data: payment });
        } else {
            // Log Payment Failure
            const payment = new Payment({
                invoiceId: invoice._id,
                amount: invoice.total,
                method: 'mock',
                reference: chargeResult.reference || 'failed_ref',
                status: 'failed'
            });
            await payment.save();

            invoice.status = 'past_due';
            await invoice.save();

            res.status(400).json({ success: false, message: chargeResult.error || "Payment failed" });
        }
    } catch (error) {
        console.error("Error processing manual payment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Trigger billing engine cycle (Admin/Dev helper)
 * POST /api/billing/trigger-cycle
 */
exports.triggerBillingCycle = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { period } = req.body;

        const date = new Date();
        const currentPeriod = period || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const results = await billingEngine.runBillingCycle(tenantId, currentPeriod);
        res.json({ success: true, message: `Billing cycle executed for ${currentPeriod}`, data: results });
    } catch (error) {
        console.error("Error triggering billing cycle:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
