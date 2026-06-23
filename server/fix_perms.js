const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

async function fixPermissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const neededPermissions = [
            { name: 'Read Audit Logs', code: 'audit_logs.read', module: 'AUDIT_LOGS', permissionScope: 'SYSTEM', isSystemPermission: true },
            { name: 'Read Sessions', code: 'sessions.read', module: 'SESSIONS', permissionScope: 'SYSTEM', isSystemPermission: true },
            { name: 'Read Settings', code: 'settings.read', module: 'SETTINGS', permissionScope: 'SYSTEM', isSystemPermission: true }
        ];

        for (const perm of neededPermissions) {
            const existing = await Permission.findOne({ code: perm.code });
            if (!existing) {
                console.log(`Creating permission: ${perm.code}`);
                await Permission.create(perm);
            }
        }

        const RolePermission = require('./src/models/RolePermission');
        const superAdmin = await Role.findOne({ name: 'System Administrator' });
        if (superAdmin) {
            let updated = false;
            for (const perm of neededPermissions) {
                const permissionDoc = await Permission.findOne({ code: perm.code });
                if (permissionDoc) {
                    const existingRp = await RolePermission.findOne({ roleId: superAdmin._id, permissionId: permissionDoc._id });
                    if (!existingRp) {
                        await RolePermission.create({ roleId: superAdmin._id, permissionId: permissionDoc._id });
                        updated = true;
                    }
                }
            }
            if (updated) {
                console.log('Updated System Administrator role with new permissions.');
            } else {
                console.log('System Administrator already has the permissions.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fixPermissions();
