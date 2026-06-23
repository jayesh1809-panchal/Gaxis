const { GAxisSDK, ConfigLoader } = require('./src/index');

try {
    const sdk = new GAxisSDK({
        baseUrl: 'http://localhost:5000',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        redirectUri: 'http://localhost:3000/callback'
    });

    console.log('SDK initialized successfully.');
    console.log('Version:', sdk.version);
    console.log('Providers available:', typeof sdk.expressProvider === 'function', typeof sdk.nodeProvider === 'function');
} catch (error) {
    console.error('Failed to initialize SDK:', error);
    process.exit(1);
}
