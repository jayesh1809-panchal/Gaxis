const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // 1. Find or create a test tenant
        let tenant = await Tenant.findOne({ slug: 'test-org-billing' });
        if (!tenant) {
            // Check if there is any tenant in the DB
            tenant = await Tenant.findOne({});
        }
        if (!tenant) {
            tenant = await Tenant.create({
                name: "G-Axis Test Tenant",
                code: "GAXIS_TEST",
                slug: "gaxis-test",
                plan: "enterprise",
                status: "active"
            });
            console.log('✅ Created Tenant:', tenant.slug);
        } else {
            console.log('✅ Found existing Tenant:', tenant.slug);
        }

        // 2. Ensure SUPER_ADMIN role exists
        let superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN', tenantId: tenant._id });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                tenantId: tenant._id,
                name: "Super Administrator",
                code: "SUPER_ADMIN",
                description: "Super user with access to all revenue and admin features",
                isSystemRole: true,
                roleType: "SYSTEM",
                status: "active"
            });
            console.log('✅ Created Role: SUPER_ADMIN');
        } else {
            console.log('✅ Found existing Role: SUPER_ADMIN');
        }

        // 3. Find or create the Admin user
        const adminEmail = "admin@gaxis-test.com";
        let adminUser = await User.findOne({ email: adminEmail, tenantId: tenant._id });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("AdminPass123!", salt);

        if (!adminUser) {
            adminUser = await User.create({
                tenantId: tenant._id,
                firstName: "System",
                lastName: "Admin",
                email: adminEmail,
                passwordHash,
                employeeId: "EMP_ADMIN_" + Math.floor(Math.random() * 100000),
                department: "IT",
                designation: "Administrator",
                status: "active",
                mustChangePassword: false
            });
            console.log('✅ Created Admin User:', adminEmail);
        } else {
            adminUser.passwordHash = passwordHash;
            adminUser.mustChangePassword = false;
            await adminUser.save();
            console.log('✅ Reset password for Admin User:', adminEmail);
        }

        // 4. Map user to SUPER_ADMIN role
        let userRoleMapping = await UserRole.findOne({ userId: adminUser._id, roleId: superAdminRole._id });
        if (!userRoleMapping) {
            userRoleMapping = await UserRole.create({
                tenantId: tenant._id,
                userId: adminUser._id,
                roleId: superAdminRole._id,
                status: "active"
            });
            console.log('✅ Assigned SUPER_ADMIN role to user.');
        } else {
            console.log('✅ User already has SUPER_ADMIN role.');
        }

        console.log('\n====================================');
        console.log('LOGIN CREDENTIALS:');
        console.log(`Tenant Slug:  ${tenant.slug}`);
        console.log(`Email:        ${adminEmail}`);
        console.log(`Password:     AdminPass123!`);
        console.log('====================================');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();
