const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

async function seedDatabase() {
    try {
        console.log('🔄 Checking database for default seeds...');

        // 1. Find or create a test tenant
        let tenant = await Tenant.findOne({ slug: 'gaxis-default' });
        if (!tenant) {
            // Check if there is any tenant in the DB
            tenant = await Tenant.findOne({});
        }
        if (!tenant) {
            tenant = await Tenant.create({
                name: "G-Axis Default Tenant",
                code: "DEFAULT",
                slug: "gaxis-default",
                plan: "enterprise",
                status: "active"
            });
            console.log('✅ Created Default Tenant:', tenant.slug);
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
        }

        // 3. Find or create the Admin user
        const adminEmail = "superadmin@g-axis.com";
        let adminUser = await User.findOne({ email: adminEmail, tenantId: tenant._id });
        
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash("AdminPass123!", salt);

            adminUser = await User.create({
                tenantId: tenant._id,
                firstName: "System",
                lastName: "Superadmin",
                email: adminEmail,
                passwordHash,
                employeeId: "EMP_ADMIN_001",
                department: "IT",
                designation: "Administrator",
                status: "active",
                mustChangePassword: false
            });
            console.log('✅ Created Default Admin User:', adminEmail);
        }

        // 4. Map user to SUPER_ADMIN role
        let userRoleMapping = await UserRole.findOne({ userId: adminUser._id, roleId: superAdminRole._id });
        if (!userRoleMapping) {
            await UserRole.create({
                tenantId: tenant._id,
                userId: adminUser._id,
                roleId: superAdminRole._id,
                status: "active"
            });
            console.log('✅ Assigned SUPER_ADMIN role to default user.');
        }

    } catch (error) {
        console.error('❌ Automatic Seeding failed:', error);
    }
}

module.exports = seedDatabase;
