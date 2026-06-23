const TenantSubscription = require('../models/TenantSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UsageCharge = require('../models/UsageCharge');
const BillingAccount = require('../models/BillingAccount');
const License = require('../models/License');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const invoiceEngine = require('./invoiceEngine');
const paymentService = require('./paymentService');
const auditService = require('./auditService');
const auditEvents = require('../constants/auditEvents');

/**
 * Run billing cycle for a single tenant and billing period (YYYY-MM)
 */
async function runBillingCycle(tenantId, period) {
    try {
        // 1. Fetch active subscriptions for tenant
        const subscriptions = await TenantSubscription.find({ tenantId, status: 'active' }).populate('planId');
        const results = [];

        // Ensure tenant has a billing account
        const billingAccount = await BillingAccount.findOneAndUpdate(
            { tenantId },
            {
                $setOnInsert: {
                    billingEmail: `billing-${tenantId}@gaxis-system.local`,
                    status: 'active',
                    currency: 'USD',
                    balance: 0
                }
            },
            { returnDocument: 'after', upsert: true }
        );

        for (const sub of subscriptions) {
            const plan = sub.planId;
            const marketplaceAppId = sub.marketplaceAppId;

            // Compute line items
            const lineItems = [];
            
            // A. Base plan charge
            if (plan.price > 0) {
                lineItems.push({
                    description: `Subscription: ${plan.name} Plan Fee`,
                    amount: plan.price,
                    quantity: 1
                });
            }

            // B. Usage overages from UsageCharge collection
            const pendingUsageCharges = await UsageCharge.find({
                tenantId,
                marketplaceAppId,
                billingPeriod: period,
                status: 'pending'
            });

            for (const charge of pendingUsageCharges) {
                lineItems.push({
                    description: `Metered Overage: ${charge.metricType.replace('_', ' ').toUpperCase()} (${charge.quantity} units)`,
                    amount: charge.amount,
                    quantity: 1
                });
            }

            if (lineItems.length === 0) {
                // If plan is free and no charges, create a zero-amount invoice line item
                lineItems.push({
                    description: `Subscription: ${plan.name} (Free Trial)`,
                    amount: 0,
                    quantity: 1
                });
            }

            // 2. Create and finalize draft invoice
            const invoice = await invoiceEngine.createDraftInvoice({
                tenantId,
                marketplaceAppId,
                period,
                lineItems,
                discount: 0
            });

            const finalizedInvoice = await invoiceEngine.finalizeInvoice(invoice._id);

            // Log invoice created event
            await auditService.logEvent({
                tenantId,
                action: auditEvents.INVOICE_CREATED || 'INVOICE_CREATED',
                category: 'Billing',
                resourceType: 'Invoice',
                resourceId: finalizedInvoice._id,
                metadata: { invoiceNumber: finalizedInvoice.invoiceNumber, total: finalizedInvoice.total }
            });

            // 3. Mark pending usage charges as invoiced
            await UsageCharge.updateMany(
                { _id: { $in: pendingUsageCharges.map(c => c._id) } },
                { status: 'invoiced' }
            );

            // 4. Charge user via configured provider (default is 'mock')
            let paymentSuccess = false;
            let paymentRef = '';

            if (finalizedInvoice.total > 0) {
                const gateway = paymentService.getProvider('mock');
                const chargeResult = await gateway.processPayment({
                    amount: finalizedInvoice.total,
                    currency: plan.currency || 'USD',
                    source: billingAccount.paymentMethodDetails?.token || 'default_card'
                });

                if (chargeResult.success) {
                    paymentSuccess = true;
                    paymentRef = chargeResult.reference;

                    // Log Payment
                    const payment = new Payment({
                        invoiceId: finalizedInvoice._id,
                        amount: finalizedInvoice.total,
                        method: 'mock',
                        reference: paymentRef,
                        status: 'completed',
                        paidDate: new Date()
                    });
                    await payment.save();

                    // Update invoice state
                    await invoiceEngine.markAsPaid(finalizedInvoice._id);

                    // Log event
                    await auditService.logEvent({
                        tenantId,
                        action: auditEvents.INVOICE_PAID || 'INVOICE_PAID',
                        category: 'Billing',
                        resourceType: 'Invoice',
                        resourceId: finalizedInvoice._id,
                        metadata: { invoiceNumber: finalizedInvoice.invoiceNumber, total: finalizedInvoice.total, paymentRef }
                    });
                } else {
                    // Payment failed
                    finalizedInvoice.status = 'past_due';
                    await finalizedInvoice.save();

                    const payment = new Payment({
                        invoiceId: finalizedInvoice._id,
                        amount: finalizedInvoice.total,
                        method: 'mock',
                        reference: chargeResult.reference || 'failed_ref',
                        status: 'failed'
                    });
                    await payment.save();

                    // Log event
                    await auditService.logEvent({
                        tenantId,
                        action: auditEvents.PAYMENT_FAILED || 'PAYMENT_FAILED',
                        category: 'Billing',
                        resourceType: 'Invoice',
                        resourceId: finalizedInvoice._id,
                        metadata: { invoiceNumber: finalizedInvoice.invoiceNumber, total: finalizedInvoice.total, error: chargeResult.error },
                        status: 'failure'
                    });
                }
            } else {
                // Free subscription invoice paid automatically
                paymentSuccess = true;
                await invoiceEngine.markAsPaid(finalizedInvoice._id);
            }

            // 5. Update/Create License entitlement based on plan limits
            if (paymentSuccess) {
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                let license = await License.findOne({ tenantId, marketplaceAppId });
                if (license) {
                    license.planId = plan._id;
                    license.status = 'active';
                    license.expiryDate = oneMonthLater;
                    license.seats = plan.limits?.users || 5;
                    license.usageLimits = {
                        apiCallsPerMonth: plan.limits?.apiCallsPerMonth || -1,
                        workflowExecutionsPerMonth: plan.limits?.workflowExecutionsPerMonth || -1,
                        storageGB: plan.limits?.storageGB || -1,
                        eventsDeliveredPerMonth: plan.limits?.eventsDeliveredPerMonth || -1
                    };
                    await license.save();
                } else {
                    license = new License({
                        tenantId,
                        marketplaceAppId,
                        planId: plan._id,
                        startDate: new Date(),
                        expiryDate: oneMonthLater,
                        status: 'active',
                        seats: plan.limits?.users || 5,
                        usageLimits: {
                            apiCallsPerMonth: plan.limits?.apiCallsPerMonth || -1,
                            workflowExecutionsPerMonth: plan.limits?.workflowExecutionsPerMonth || -1,
                            storageGB: plan.limits?.storageGB || -1,
                            eventsDeliveredPerMonth: plan.limits?.eventsDeliveredPerMonth || -1
                        }
                    });
                    await license.save();
                }

                // Log license event
                await auditService.logEvent({
                    tenantId,
                    action: auditEvents.LICENSE_CREATED || 'LICENSE_CREATED',
                    category: 'Licensing',
                    resourceType: 'License',
                    resourceId: license._id,
                    metadata: { planId: plan._id, seats: license.seats }
                });
            }

            results.push({
                marketplaceAppId,
                invoiceNumber: finalizedInvoice.invoiceNumber,
                total: finalizedInvoice.total,
                status: finalizedInvoice.status,
                paymentRef
            });
        }

        return results;
    } catch (error) {
        console.error("Error running billing cycle for tenant:", error);
        throw error;
    }
}

module.exports = {
    runBillingCycle
};
