const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const apiMarketplaceEngine = require("../src/services/apiMarketplaceEngine");
const apiMonetizationEngine = require("../src/services/apiMonetizationEngine");
const User = require("../src/models/User");

async function runTests() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/g_axis_v2");
        console.log("Connected.\n");

        const providerUserId = new mongoose.Types.ObjectId();
        const subscriberUserId = new mongoose.Types.ObjectId();

        console.log("--- Testing Provider Registration ---");
        const provider = await apiMarketplaceEngine.registerProvider(providerUserId, "Test Corp");
        console.log("Provider created:", provider.organizationName);

        console.log("\n--- Testing API Publishing ---");
        const productData = {
            name: "Weather API",
            description: "Get realtime weather",
            category: "Custom",
            baseEndpoint: "/v1/weather"
        };
        const plansData = [
            { name: "Free", type: "free", price: 0, quotaLimits: { requestsPerMonth: 100 } },
            { name: "Pro", type: "usage_based", price: 0 } // usage based pricing is in monetization rule
        ];
        const monetizationData = {
            perRequestRate: 0.01,
            revenueSharePercentage: { provider: 80, platform: 20 }
        };
        
        const { product, plans } = await apiMarketplaceEngine.publishProduct(provider._id, productData, plansData, monetizationData);
        console.log("Product Published:", product.name);
        console.log("Plans Created:", plans.map(p => p.name).join(", "));

        console.log("\n--- Testing Subscription ---");
        const proPlan = plans.find(p => p.name === "Pro");
        const subscription = await apiMarketplaceEngine.subscribeToAPI(subscriberUserId, product._id, proPlan._id);
        console.log("Tenant subscribed to Pro Plan.");

        console.log("\n--- Testing API Usage (Gateway Event) ---");
        await apiMonetizationEngine.recordUsageEvent(subscriberUserId, product._id, 100); // simulate 100 requests
        console.log("Recorded 100 API requests for subscriber.");

        console.log("\n--- Testing Billing & Revenue Share ---");
        const ledger = await apiMonetizationEngine.generateBillingLedger(subscription._id);
        console.log("Ledger Generated:");
        console.log(`- Total Requests: ${ledger.totalRequests}`);
        console.log(`- Amount Due: $${ledger.amountDue}`);
        console.log(`- Provider Share: $${ledger.providerShare}`);
        console.log(`- Platform Share: $${ledger.platformShare}`);

        console.log("\nAll API Marketplace components tested successfully!\n");

    } catch (e) {
        console.error("CRITICAL:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runTests();
