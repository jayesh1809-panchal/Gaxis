const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Tenant = require('../models/Tenant');
const Application = require('../models/Application');
const User = require('../models/User');

async function setupHrmdSso() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // Find the default tenant
        const tenant = await Tenant.findOne({});
        if (!tenant) {
            throw new Error('Tenant not found. Run seedDatabase first.');
        }

        const superAdmin = await User.findOne({ email: 'superadmin@g-axis.com' });

        const clientId = 'hrmd-client-123';
        const clientSecret = 'hrmd-secret-abc'; // Plain text secret
        const salt = await bcrypt.genSalt(10);
        const clientSecretHash = await bcrypt.hash(clientSecret, salt);

        let app = await Application.findOne({ clientId });
        
        if (!app) {
            app = await Application.create({
                tenantId: tenant._id,
                ownerId: superAdmin ? superAdmin._id : null,
                name: "HRMD Project",
                code: "HRMD",
                frontendUrl: "http://localhost:5180",
                backendUrl: "http://localhost:5012",
                version: "1.0.0",
                description: "HRMD Application for SSO",
                status: "active",
                clientId,
                clientSecretHash,
                clientType: "confidential",
                redirectUris: ["http://localhost:5012/api/auth/sso/callback"],
                postLogoutRedirectUris: ["http://localhost:5180"],
                allowedOrigins: ["http://localhost:5180", "http://localhost:5012"]
            });
            console.log('✅ Created HRMD Application in G-Axis SSO.');
        } else {
            console.log('✅ HRMD Application already exists in G-Axis SSO.');
        }

        console.log('\n====================================');
        console.log('SSO CREDENTIALS FOR HRMD:');
        console.log(`GAXIS_CLIENT_ID:     ${clientId}`);
        console.log(`GAXIS_CLIENT_SECRET: ${clientSecret}`);
        console.log('====================================\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

setupHrmdSso();
