const fs = require('fs/promises');
const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        console.log('\n[TEST] Setting up G-Axis Marketplace Test...\n');

        // 1. Initialize SDK
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'system_client',
            clientSecret: 'system_secret',
            redirectUri: 'http://localhost:3000/callback'
        });

        // 2. Create mock CRM manifest
        const crmManifest = {
            name: "crm",
            version: "1.0.0",
            type: "application",
            dependencies: {},
            permissions: [],
            features: ["oauth", "rbac", "session"],
            frontendUrl: "http://localhost:3000",
            backendUrl: "http://localhost:3001",
            framework: "react"
        };
        await fs.writeFile('gaxis-package-crm.json', JSON.stringify(crmManifest, null, 2));

        // 3. Create mock CRM Plugin manifest with dependency
        const pluginManifest = {
            name: "crm-reporting-plugin",
            version: "1.0.0",
            type: "plugin",
            dependencies: {
                "crm": "^1.0.0"
            },
            permissions: [],
            features: ["oauth"],
            frontendUrl: "http://localhost:3002",
            backendUrl: "http://localhost:3003",
            framework: "express"
        };
        await fs.writeFile('gaxis-package-plugin.json', JSON.stringify(pluginManifest, null, 2));

        // --- TEST 1: Publish ---
        console.log('\n--- TEST 1: Publish ---');
        await sdk.marketplace.publish('./gaxis-package-crm.json');
        await sdk.marketplace.publish('./gaxis-package-plugin.json');
        
        const searchResults = await sdk.marketplace.search({ type: 'application' });
        console.log(`Found ${searchResults.length} application(s) in registry.`);

        // --- TEST 2: Install with Dependency Resolution ---
        console.log('\n--- TEST 2: Install ---');
        // Installing the plugin will trigger dependency resolution for 'crm@^1.0.0'
        const pluginApp = await sdk.marketplace.install('crm-reporting-plugin');
        console.log(`Plugin Installed. Provisioned App ID: ${pluginApp.applicationId}`);

        // --- TEST 3: Upgrade ---
        console.log('\n--- TEST 3: Upgrade ---');
        crmManifest.version = "1.1.0";
        await fs.writeFile('gaxis-package-crm.json', JSON.stringify(crmManifest, null, 2));
        await sdk.marketplace.publish('./gaxis-package-crm.json');
        await sdk.marketplace.upgrade('crm');
        console.log('CRM Upgraded successfully.');

        // --- TEST 4: Uninstall ---
        console.log('\n--- TEST 4: Uninstall ---');
        await sdk.marketplace.uninstall('crm-reporting-plugin');
        console.log('Plugin Uninstalled successfully.');

        console.log('\n[TEST] Marketplace Engine Test Passed!\n');

        // Cleanup
        await fs.unlink('gaxis-package-crm.json');
        await fs.unlink('gaxis-package-plugin.json');
    } catch (error) {
        console.error('\n[TEST] Failed Marketplace Test:', error);
        process.exit(1);
    }
}

runTest();
