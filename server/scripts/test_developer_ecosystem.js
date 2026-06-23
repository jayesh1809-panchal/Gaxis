const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const APIKey = require("../src/models/APIKey");
const APIUsageRecord = require("../src/models/APIUsageRecord");
const DeveloperApplication = require("../src/models/DeveloperApplication");
const DeveloperAccount = require("../src/models/DeveloperAccount");
const { generateApiKey } = require("../src/services/apiGatewayService");
const { dispatchWebhook } = require("../src/services/webhookEngine");

async function runTests() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/g_axis_v2");
        console.log("Connected.\n");

        console.log("--- Testing Developer Registration ---");
        const devId = new mongoose.Types.ObjectId();
        const account = await DeveloperAccount.create({
            userId: devId,
            tier: "pro"
        });
        console.log("Developer Account created:", account._id);

        console.log("\n--- Testing Application Registration ---");
        const app = await DeveloperApplication.create({
            name: "Test App",
            description: "Testing the ecosystem",
            developerId: account._id
        });
        console.log("App created:", app.name);

        console.log("\n--- Testing API Key Generation ---");
        const { keyId, rawKey, prefix } = await generateApiKey(account._id, app._id, "Prod Key", ["read", "write"]);
        console.log("Generated Key ID:", keyId);
        console.log("Key Prefix:", prefix);

        console.log("\n--- Testing Usage Record Insertion ---");
        await APIUsageRecord.create({
            applicationId: app._id,
            endpoint: "/api/test",
            method: "GET",
            statusCode: 200,
            latencyMs: 45
        });
        console.log("Usage recorded successfully.");

        console.log("\n--- Testing Webhook Engine Dispatch (Mock) ---");
        await dispatchWebhook("test.event", { msg: "Hello Webhook!" });
        console.log("Webhook dispatch triggered.");

        console.log("\nAll Developer Ecosystem components tested successfully!\n");

    } catch (e) {
        console.error("CRITICAL:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runTests();
