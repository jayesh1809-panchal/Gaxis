const fs = require('fs/promises');
const { 
    GAxisSDK, 
    IdentityManager, 
    AuthorizationEngine, 
    SessionManager, 
    SingleLogoutManager 
} = require('@gaxis/sdk');

async function test() {
    console.log('Testing @gaxis/sdk imports...');
    console.log('GAxisSDK:', !!GAxisSDK);
    // The others are inside the module or on the instance? Wait, the exports from index.js were:
    // GAxisSDK, ConfigLoader, VersionManager, Errors, Storage, Adapters. 
    // Wait, let's verify what the user asked vs what's exported.
    
    // Create manifest
    await fs.writeFile('gaxis.config.json', JSON.stringify({
        applicationCode: "crm-test",
        applicationName: "CRM Test",
        version: "1.0.0",
        type: "application",
        framework: "express",
        features: ["oauth", "slo"],
        frontendUrl: "http://localhost:3000",
        backendUrl: "http://localhost:3001"
    }));

    const sdk = new GAxisSDK({
        baseUrl: 'http://localhost:5000',
        clientId: 'system_client',
        clientSecret: 'system_secret',
        redirectUri: 'http://localhost:3000/callback'
    });
    console.log('SDK Instantiated');

    console.log('Running integrate()...');
    await sdk.integrate({ manifest: './gaxis.config.json' });
    console.log('Integrate finished successfully.');
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
