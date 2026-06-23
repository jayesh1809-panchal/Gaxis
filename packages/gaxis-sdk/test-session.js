const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'test_client',
            clientSecret: 'test_secret',
            redirectUri: 'http://localhost:3000/callback',
            sessionIdleTimeout: 10, // 10 seconds for quick testing
            enableDeviceTracking: true
        });

        console.log('SDK initialized with Session Engine.');

        const mockUserId = 'local-user-123';
        const mockReq = {
            ip: '192.168.1.10',
            headers: {
                'user-agent': 'Mozilla/5.0 TestBrowser/1.0'
            }
        };

        // 1. Create Session
        const session = await sdk.session.createSession(mockUserId, mockReq);
        console.log(`\nCreated Session ID: ${session.sessionId}`);
        console.log(`Device Registered: ${session.deviceId}`);

        // 2. Validate Session
        const validated = await sdk.session.validateSession(session.sessionId, mockReq);
        console.log(`\nSession Validation Status: ${validated.status}`);

        // 3. Track Activity
        await sdk.session.trackActivity(session.sessionId);
        const lastActivity = await sdk.session.getActivity(session.sessionId);
        console.log(`Last Activity Updated: ${lastActivity}`);

        // 4. Revoke Session
        await sdk.session.revokeSession(session.sessionId);
        try {
            await sdk.session.validateSession(session.sessionId, mockReq);
            throw new Error('Validation should have failed for revoked session!');
        } catch (err) {
            console.log(`\nRevocation test passed! Error caught: ${err.message}`);
        }

        console.log('\nSession Engine Test Passed!');

    } catch (error) {
        console.error('Failed Session Test:', error);
        process.exit(1);
    }
}

runTest();
