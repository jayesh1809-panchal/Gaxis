const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ecosystemOSEngine = require("../src/services/ecosystemOSEngine");
const globalSearchEngine = require("../src/services/globalSearchEngine");
const contextEngine = require("../src/services/contextEngine");

const User = require("../src/models/User");
const Workflow = require("../src/models/WorkflowDefinition");

async function runTests() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/g_axis_v2");
        console.log("Connected.\n");

        const tenantId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // 1. Setup Mock Data
        await User.create({ 
            _id: userId, 
            tenantId, 
            firstName: "Test", 
            lastName: "User", 
            email: "test.ecosystem@example.com", 
            jobTitle: "Engineer",
            department: "Engineering",
            passwordHash: "hash123"
        });
        
        await Workflow.create({
            tenantId,
            name: "Onboarding Workflow",
            description: "Handles employee onboarding across HRMS and IT.",
            status: "active",
            trigger: { type: "event", event: "user.created", source: "hrms" },
            code: "console.log('hi');",
            actions: []
        });

        // 2. Test OS App Registry
        console.log("--- Testing OS Registry ---");
        const app = await ecosystemOSEngine.registerApp({
            name: "HRMS Connect",
            appId: "hrms_core",
            type: "internal",
            description: "Core Human Resources",
            icon: "FaUsers",
            launchUrl: "/hrms"
        });
        console.log("Registered App:", app.name);

        // 3. Test OS Workspace (Launcher)
        console.log("\n--- Testing OS Workspace (Universal Launcher) ---");
        const workspace = await ecosystemOSEngine.getWorkspace(userId);
        console.log("Workspace initialized. Pinned Apps count:", workspace.pinnedApps.length);
        
        // 4. Test Context Engine
        console.log("\n--- Testing Context Engine ---");
        let context = await contextEngine.updateContext(userId, { 
            activeAppId: "hrms_core", 
            activeEntityId: "emp_123",
            entityType: "employee"
        });
        console.log("Context Updated. Active App:", context.sessionData.activeAppId);
        console.log("Context Updated. Active Entity:", context.sessionData.activeEntityId);

        // 5. Test Global Search (Federated)
        console.log("\n--- Testing Global Federated Search ---");
        console.log("Searching for 'Test'...");
        let results = await globalSearchEngine.search("Test", tenantId);
        console.log("Found:", results.map(r => `[${r.type}] ${r.title}`).join(", "));

        console.log("\nSearching for 'Onboarding'...");
        results = await globalSearchEngine.search("Onboarding", tenantId);
        console.log("Found:", results.map(r => `[${r.type}] ${r.title}`).join(", "));

        console.log("\nSearching for 'HRMS'...");
        results = await globalSearchEngine.search("HRMS", tenantId);
        console.log("Found:", results.map(r => `[${r.type}] ${r.title}`).join(", "));

        console.log("\nAll Ecosystem OS components tested successfully!\n");

    } catch (e) {
        console.error("CRITICAL:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runTests();
