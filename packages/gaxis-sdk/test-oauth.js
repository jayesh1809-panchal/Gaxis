const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'test_client',
            clientSecret: 'test_secret',
            redirectUri: 'http://localhost:3000/callback'
        });

        console.log('SDK initialized successfully.');
        console.log('OAuth Client:', typeof sdk.oauth.login === 'function' ? 'Loaded' : 'Missing');

        // We won't actually trigger getLoginUrl here because it requires network access to a real OIDC server for discovery,
        // and we are just validating compilation and instantiation structure.

    } catch (error) {
        console.error('Failed to initialize SDK:', error);
        process.exit(1);
    }
}

runTest();
