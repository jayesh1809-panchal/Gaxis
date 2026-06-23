const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'test_client',
            clientSecret: 'test_secret',
            redirectUri: 'http://localhost:3000/callback',
            roleMapping: {
                'urn:gaxis:app1:admin': 'SYSTEM_ADMIN'
            },
            permissionMapping: {
                'app1:read:users': 'READ_USERS'
            }
        });

        console.log('SDK initialized with Authz Engine.');

        // Simulate an AUTH_SUCCESS event that comes from OAuthClient + IdentityManager
        const mockUserId = 'local-user-123';
        const mockTokenPayload = {
            sub: 'gaxis-user-001',
            roles: ['urn:gaxis:app1:admin', 'urn:gaxis:app1:unknown'],
            permissions: ['app1:read:users']
        };

        // Trigger the event
        sdk.events.emitEvent(sdk.events.events.AUTH_SUCCESS, {
            localUserId: mockUserId,
            tokenPayload: mockTokenPayload
        });

        // Wait a tiny bit for the async event listeners to process storage writing
        await new Promise(resolve => setTimeout(resolve, 50));

        // Query Authorization Engine
        const hasAdminRole = await sdk.authz.hasRole(mockUserId, 'SYSTEM_ADMIN');
        const hasUnknownRole = await sdk.authz.hasRole(mockUserId, 'urn:gaxis:app1:unknown'); // Passthrough check
        const hasReadUsers = await sdk.authz.hasPermission(mockUserId, 'READ_USERS');

        const canDoBoth = await sdk.authz.can(mockUserId, {
            roles: ['SYSTEM_ADMIN'],
            permissions: ['READ_USERS'],
            requireAll: true
        });

        console.log('Has SYSTEM_ADMIN Role:', hasAdminRole);
        console.log('Has Unknown Role (Passthrough):', hasUnknownRole);
        console.log('Has READ_USERS Perm:', hasReadUsers);
        console.log('Can do both:', canDoBoth);

        if (hasAdminRole && hasUnknownRole && hasReadUsers && canDoBoth) {
            console.log('Authorization Engine Test Passed!');
        } else {
            throw new Error('Authz assertions failed.');
        }

    } catch (error) {
        console.error('Failed Authz Test:', error);
        process.exit(1);
    }
}

runTest();
