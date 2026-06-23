const fs = require('fs/promises');
const { GAxisSDK } = require('./src/index');

async function runTest() {
    try {
        // 1. Create a dummy manifest for the test
        const manifest = {
            applicationCode: 'testapp',
            applicationName: 'Test React App',
            frontendUrl: 'http://localhost:3000',
            backendUrl: 'http://localhost:3001',
            framework: 'react',
            database: 'none',
            features: ['oauth', 'session', 'slo']
        };
        await fs.writeFile('gaxis.config.json', JSON.stringify(manifest, null, 2));

        // 2. Initialize SDK
        const sdk = new GAxisSDK({
            baseUrl: 'http://localhost:5000',
            clientId: 'system_client',
            clientSecret: 'system_secret',
            redirectUri: 'http://localhost:3000/callback'
        });

        console.log('SDK initialized. Running zero-code integration...\n');

        // 3. Execute zero-code integration
        const application = await sdk.integrate({ manifest: './gaxis.config.json' });

        console.log(`\nSuccess! Application integrated.`);
        console.log(`App Name: ${application.applicationName}`);
        console.log(`Status: ${application.status}`);

        // 4. Verify generated files
        const envContents = await fs.readFile('.env.gaxis', 'utf8');
        console.log('\nGenerated .env.gaxis:\n', envContents);

        const bootstrapContents = await fs.readFile('GAxisBootstrap.jsx', 'utf8');
        console.log('\nGenerated GAxisBootstrap.jsx lines: ', bootstrapContents.split('\n').length);

        console.log('\nZero-Code Engine Test Passed!');

        // Cleanup
        await fs.unlink('gaxis.config.json');
        await fs.unlink('.env.gaxis');
        await fs.unlink('GAxisBootstrap.jsx');
    } catch (error) {
        console.error('Failed Integration Test:', error);
        process.exit(1);
    }
}

runTest();
