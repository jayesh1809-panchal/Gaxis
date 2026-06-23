const { GAxisSDK, Adapters } = require('./src/index');

async function runTest() {
    try {
        // Mock Custom Adapter for testing without a DB
        const mockAdapter = new Adapters.CustomUserAdapter({
            findByGAxisId: async (id) => null, // Simulate new user
            findByEmail: async (email) => null,
            create: async (data) => ({ id: 'mock-123', ...data })
        });

        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'test_client',
            clientSecret: 'test_secret',
            redirectUri: 'http://localhost:3000/callback',
            provisioningMode: 'AUTO_CREATE',
            userAdapter: mockAdapter,
            identityMapping: {
                gaxisUserId: 'gaxisUserId',
                email: 'email',
                firstName: 'given_name'
            }
        });

        console.log('SDK initialized with Identity Engine.');

        // Simulate Provisioning Call
        const mockIdToken = {
            sub: 'gaxis-user-001',
            email: 'test@gaxis.com',
            given_name: 'John'
        };

        const provisionedUser = await sdk.identity.provisionUser(mockIdToken);
        console.log('Provisioned User:', provisionedUser);

        if (provisionedUser.gaxisUserId === 'gaxis-user-001' && provisionedUser.firstName === 'John') {
            console.log('Identity Engine Test Passed!');
        } else {
            throw new Error('Data mapping failed.');
        }

    } catch (error) {
        console.error('Failed Identity Test:', error);
        process.exit(1);
    }
}

runTest();
