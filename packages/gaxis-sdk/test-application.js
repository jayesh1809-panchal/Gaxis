const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'system_client',
            clientSecret: 'system_secret',
            redirectUri: 'http://localhost:3000/callback'
        });

        console.log('SDK initialized with Application Lifecycle Engine.\n');

        // 1. Register a new Application
        console.log('Registering CRM Application...');
        const { application, clientSecret } = await sdk.application.registerApplication({
            applicationCode: 'crm',
            applicationName: 'Global CRM',
            frontendUrl: 'http://localhost:3000',
            backendUrl: 'http://localhost:3001'
        });

        console.log(`Success! Provisioned App: ${application.applicationName}`);
        console.log(`Generated Client ID: ${application.applicationId}`);
        console.log(`Generated Secret: ${clientSecret}`);
        console.log(`Auto-generated Scopes: ${application.scopes.join(', ')}`);
        console.log(`Status: ${application.status}`);

        // 2. Test Secret Rotation
        console.log('\nRotating Secret...');
        const newSecret = await sdk.application.rotateSecret(application.applicationId);
        console.log(`New Secret: ${newSecret}`);

        // 3. Check Health (Mocked backendUrl will fail, expecting INACTIVE state shift)
        console.log('\nChecking Health (expecting failure to localhost:3001)...');
        const health = await sdk.application.checkHealth(application.applicationId);
        console.log(`Health Status: ${health.status}`);

        // 4. Verify State Transition
        const updatedApp = await sdk.application.getApplication(application.applicationId);
        console.log(`App Status updated to: ${updatedApp.status}`);

        console.log('\nApplication Engine Test Passed!');
    } catch (error) {
        console.error('Failed Application Test:', error);
        process.exit(1);
    }
}

runTest();
