const mongoose = require('mongoose');

async function updateApp() {
    try {
        await mongoose.connect('mongodb://localhost:27017/GAxis-pepole');
        const db = mongoose.connection.db;

        await db.collection('applications').updateOne(
            { clientId: 'hrmd-client-123' },
            {
                $set: {
                    redirectUris: ['https://hrms.gitakshmi.com/api/auth/sso/callback', 'http://localhost:5012/api/auth/sso/callback'],
                    postLogoutRedirectUris: ['https://hrms.gitakshmi.com', 'http://localhost:5180'],
                    allowedOrigins: ['https://hrms.gitakshmi.com', 'http://localhost:5180', 'http://localhost:5012']
                }
            }
        );
        console.log("Updated HRMD app in database successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
updateApp();
