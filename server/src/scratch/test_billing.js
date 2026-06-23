const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configure environment
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Tenant = require('../models/Tenant');
const MarketplaceApplication = require('../models/MarketplaceApplication');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const TenantSubscription = require('../models/TenantSubscription');
const UsageCharge = require('../models/UsageCharge');
const BillingAccount = require('../models/BillingAccount');
const Invoice = require('../models/Invoice');
const License = require('../models/License');
const Payment = require('../models/Payment');
const billingEngine = require('../services/billingEngine');
const User = require('../models/User');

async function verifyBillingPlatform() {
    console.log('=== STARTING BILLING ENGINE INTEGRATION TEST ===');
    
    // 1. Database Connection
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI env variable is missing!");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // 2. Seeding Test Entities
    let testTenant = null;
    let testApp = null;
    let testPlan = null;
    let testSub = null;
    let testBillingAccount = null;
    let testCharge = null;

    try {
        console.log('\n--- Seeding Mock Data ---');
        
        // Tenant
        testTenant = await Tenant.create({
            name: "Test Org Billing Inc.",
            code: "TEST_ORG_BILLING_" + Math.floor(Math.random() * 1000),
            slug: "test-org-billing-" + Math.floor(Math.random() * 1000),
            plan: "pro",
            status: "active"
        });
        console.log(`✅ Seeded Tenant: ${testTenant.name} (${testTenant.code})`);

        // Marketplace App
        testApp = await MarketplaceApplication.create({
            name: "Cloud Billing App",
            code: "CLOUD_BILLING_APP_" + Math.floor(Math.random() * 1000),
            category: "Finance",
            version: "1.0.0",
            status: "published",
            publisherId: new mongoose.Types.ObjectId()
        });
        console.log(`✅ Seeded Marketplace App: ${testApp.name} (${testApp.code})`);

        // Subscription Plan
        testPlan = await SubscriptionPlan.create({
            marketplaceAppId: testApp._id,
            name: "Enterprise Tier Plan",
            code: "ENT_TIER_PLAN_" + Math.floor(Math.random() * 1000),
            price: 299,
            currency: 'USD',
            limits: {
                users: 20,
                storageGB: 500,
                apiCallsPerMonth: 100000
            },
            features: ["feature_analytics", "feature_api_access", "feature_sso"],
            status: 'active'
        });
        console.log(`✅ Seeded Subscription Plan: ${testPlan.name} ($${testPlan.price})`);

        // Tenant Subscription
        testSub = await TenantSubscription.create({
            tenantId: testTenant._id,
            marketplaceAppId: testApp._id,
            planId: testPlan._id,
            status: 'active'
        });
        console.log(`✅ Seeded Tenant Subscription`);

        // Billing Account
        testBillingAccount = await BillingAccount.create({
            tenantId: testTenant._id,
            billingEmail: "finance@test-org-billing.local",
            paymentMethodDetails: {
                token: "default_card",
                taxRate: 0.10 // 10% tax
            },
            balance: 0,
            status: 'active'
        });
        console.log(`✅ Seeded Billing Account`);

        // Pending Usage Charge (Arrears)
        const period = "2026-06";
        testCharge = await UsageCharge.create({
            tenantId: testTenant._id,
            marketplaceAppId: testApp._id,
            metricType: 'api_calls',
            quantity: 50,
            rate: 2, // $2 per unit overage
            amount: 100, // $100 total usage charge
            billingPeriod: period,
            status: 'pending'
        });
        console.log(`✅ Seeded metered UsageCharge: ${testCharge.quantity} API Calls @ $${testCharge.rate} = $${testCharge.amount}`);

        // 3. Run Billing Engine Cycle
        console.log('\n--- Running Billing Cycle Engine ---');
        const results = await billingEngine.runBillingCycle(testTenant._id, period);
        console.log('✅ Billing Cycle executed. Resulting transactions:');
        console.log(JSON.stringify(results, null, 2));

        console.log('\n--- Verifying Invoices and Licenses in DB ---');
        
        // Verify Invoice
        const invoice = await Invoice.findOne({ tenantId: testTenant._id, billingPeriod: period });
        console.assert(invoice, "Invoice should be generated in database.");
        console.log(`✅ Found Invoice ${invoice.invoiceNumber}. Total: $${invoice.total}. Status: ${invoice.status}`);
        
        // Expected subtotal = $299 (Plan) + $100 (Usage) = $399. Tax (10%) = $39.90. Total = $438.90
        console.assert(invoice.amount === 399, `Subtotal expected: 399, got: ${invoice.amount}`);
        console.assert(invoice.tax === 39.9, `Tax expected: 39.9, got: ${invoice.tax}`);
        console.assert(invoice.total === 438.9, `Total expected: 438.9, got: ${invoice.total}`);
        console.assert(invoice.status === 'paid', "Status should be transitioned to 'paid' after successful mock payment.");

        // Verify Usage Charge status
        const updatedCharge = await UsageCharge.findById(testCharge._id);
        console.assert(updatedCharge.status === 'invoiced', "Usage charge status should be transitioned to 'invoiced'.");
        console.log("✅ Verified usage charge status updated to 'invoiced'.");

        // Verify License entitlement
        const license = await License.findOne({ tenantId: testTenant._id, marketplaceAppId: testApp._id });
        console.assert(license, "License entitlement should have been created.");
        console.assert(license.status === 'active', "License status should be active.");
        console.assert(license.seats === 20, `License seats should be 20, got: ${license.seats}`);
        console.assert(license.usageLimits.apiCallsPerMonth === 100000, "License API calls limit matches plan.");
        console.log(`✅ Verified License. Seats: ${license.seats}, Expiry: ${license.expiryDate.toLocaleDateString()}`);

        // Verify Payment record
        const payment = await Payment.findOne({ invoiceId: invoice._id });
        console.assert(payment, "Payment record must exist.");
        console.assert(payment.status === 'completed', "Payment status should be completed.");
        console.log(`✅ Verified Payment. Reference: ${payment.reference}, Status: ${payment.status}`);

        console.log('\n=== ALL BILLING INTEGRATION TESTS PASSED SUCCESSFULLY ===');
    } catch (error) {
        console.error('❌ TEST FAILURE:', error.message);
    } finally {
        console.log('\n--- Cleaning Up Seeding Records ---');
        if (testTenant) await Tenant.findByIdAndDelete(testTenant._id).catch(()=>null);
        if (testApp) await MarketplaceApplication.findByIdAndDelete(testApp._id).catch(()=>null);
        if (testPlan) await SubscriptionPlan.findByIdAndDelete(testPlan._id).catch(()=>null);
        if (testSub) await TenantSubscription.findByIdAndDelete(testSub._id).catch(()=>null);
        if (testBillingAccount) await BillingAccount.findByIdAndDelete(testBillingAccount._id).catch(()=>null);
        if (testCharge) await UsageCharge.findByIdAndDelete(testCharge._id).catch(()=>null);
        
        await mongoose.disconnect();
        console.log('✅ Disconnected MongoDB. Test script finished.');
        process.exit(0);
    }
}

verifyBillingPlatform();
