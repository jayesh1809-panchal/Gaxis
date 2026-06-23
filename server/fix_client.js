const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/G-Axis/server/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Find missing hrms_production_client_32ea3c
    const existing = await db.collection('applications').findOne({ clientId: 'hrms production_client_32ea3c' });
    if (existing) {
        console.log("Found erroneous client:", existing);
        const result = await db.collection('applications').updateOne(
            { clientId: 'hrms production_client_32ea3c' },
            { $set: { 
                clientId: 'hrms_production_client_32ea3c',
                redirectUris: ['http://localhost:5176/auth/callback', 'http://localhost:5176'],
                grantTypes: ['authorization_code', 'refresh_token'],
                scopes: ['openid', 'profile', 'email']
            } }
        );
        console.log('UPDATE RESULT:', result);
    } else {
        const check = await db.collection('applications').findOne({ clientId: 'hrms_production_client_32ea3c' });
        if (check) {
            console.log("Client already fixed:", check);
        } else {
            console.log("Client not found at all.");
        }
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
