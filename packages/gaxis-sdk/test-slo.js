const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'test_client',
            clientSecret: 'test_secret',
            redirectUri: 'http://localhost:3000/callback',
            enableSLO: true,
            enableCrossAppLogout: true
        });

        console.log('SDK initialized with SLO Engine.');

        const mockUserId = 'slo-user-999';

        // 1. Create a session
        const session = await sdk.session.createSession(mockUserId, { headers: {} });
        console.log(`\nCreated Local Session: ${session.sessionId}`);

        // 2. Register Mock Applications
        await sdk.slo.registerApplication({
            applicationId: 'crm-app-1',
            applicationName: 'CRM Dashboard',
            logoutEndpoint: 'http://localhost:3001/api/slo/receive'
        });
        await sdk.slo.registerApplication({
            applicationId: 'hrms-app-2',
            applicationName: 'HRMS Portal',
            logoutEndpoint: 'http://localhost:3002/api/slo/receive'
        });

        // 3. Initiate Global Logout
        // Note: The broadcaster will try to hit the mock endpoints and fail, which is expected.
        console.log('\nInitiating Global Logout...');
        await sdk.slo.globalLogout(mockUserId);

        // 4. Verify Local Session is Destroyed/Revoked
        try {
            await sdk.session.validateSession(session.sessionId);
            throw new Error('Session should have been revoked by SLO Local Logout!');
        } catch (err) {
            console.log(`\nLocal Revocation successful: ${err.message}`);
        }

        console.log('\nSLO Engine Test Passed!');

    } catch (error) {
        console.error('Failed SLO Test:', error);
        process.exit(1);
    }
}

runTest();
