const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const BillingAccount = require('../models/BillingAccount');

/**
 * Generate a unique, formatted invoice number
 */
function generateInvoiceNumber(period) {
    // Format: INV-YYYYMM-XXXX
    const cleanPeriod = period.replace('-', '');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${cleanPeriod}-${rand}`;
}

/**
 * Create a draft invoice
 */
async function createDraftInvoice({ tenantId, marketplaceAppId, period, lineItems, discount = 0 }) {
    try {
        const billingAccount = await BillingAccount.findOne({ tenantId });
        const taxRate = (billingAccount && billingAccount.paymentMethodDetails?.taxRate) || 0.15; // default 15% tax

        const subtotal = lineItems.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
        const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
        const total = parseFloat((subtotal + taxAmount - discount).toFixed(2));

        const invoiceNumber = generateInvoiceNumber(period);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14-day payment window

        const invoice = new Invoice({
            invoiceNumber,
            tenantId,
            marketplaceAppId,
            billingPeriod: period,
            amount: subtotal,
            tax: taxAmount,
            discount,
            total: total > 0 ? total : 0,
            status: 'draft',
            dueDate,
            lineItems
        });

        await invoice.save();
        return invoice;
    } catch (error) {
        console.error("Error creating draft invoice:", error);
        throw error;
    }
}

/**
 * Transition an invoice from draft to unpaid (finalizing and locking it)
 */
async function finalizeInvoice(invoiceId) {
    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        if (invoice.status !== 'draft') throw new Error("Only draft invoices can be finalized");

        invoice.status = 'unpaid';
        invoice.issuedDate = new Date();
        await invoice.save();
        return invoice;
    } catch (error) {
        console.error("Error finalizing invoice:", error);
        throw error;
    }
}

/**
 * Mark an invoice as paid
 */
async function markAsPaid(invoiceId) {
    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        if (['paid', 'void'].includes(invoice.status)) {
            throw new Error(`Cannot pay invoice in status ${invoice.status}`);
        }

        invoice.status = 'paid';
        await invoice.save();
        return invoice;
    } catch (error) {
        console.error("Error marking invoice as paid:", error);
        throw error;
    }
}

module.exports = {
    createDraftInvoice,
    finalizeInvoice,
    markAsPaid
};
