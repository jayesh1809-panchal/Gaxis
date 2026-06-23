const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Permission = require("../models/Permission");

// Load env vars
dotenv.config({ path: __dirname + "/../../.env" });

const seedPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding...");

        const systemPermissions = [
            // APPLICATIONS Module
            { name: "Applications Read", code: "applications.read", module: "APPLICATIONS", description: "Read applications", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Applications Create", code: "applications.create", module: "APPLICATIONS", description: "Create applications", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Applications Update", code: "applications.update", module: "APPLICATIONS", description: "Update applications", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Applications Delete", code: "applications.delete", module: "APPLICATIONS", description: "Delete applications", isSystemPermission: true, permissionScope: "SYSTEM" },

            // USERS Module
            { name: "Users Read", code: "users.read", module: "USERS", description: "Read users", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Users Create", code: "users.create", module: "USERS", description: "Create users", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Users Update", code: "users.update", module: "USERS", description: "Update users", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Users Delete", code: "users.delete", module: "USERS", description: "Delete users", isSystemPermission: true, permissionScope: "SYSTEM" },

            // ROLES Module
            { name: "Roles Read", code: "roles.read", module: "ROLES", description: "Read roles", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Roles Create", code: "roles.create", module: "ROLES", description: "Create roles", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Roles Update", code: "roles.update", module: "ROLES", description: "Update roles", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Roles Delete", code: "roles.delete", module: "ROLES", description: "Delete roles", isSystemPermission: true, permissionScope: "SYSTEM" },

            // PERMISSIONS Module
            { name: "Permissions Read", code: "permissions.read", module: "PERMISSIONS", description: "Read permissions", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Permissions Create", code: "permissions.create", module: "PERMISSIONS", description: "Create permissions", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Permissions Update", code: "permissions.update", module: "PERMISSIONS", description: "Update permissions", isSystemPermission: true, permissionScope: "SYSTEM" },
            { name: "Permissions Delete", code: "permissions.delete", module: "PERMISSIONS", description: "Delete permissions", isSystemPermission: true, permissionScope: "SYSTEM" },
        ];

        for (const permData of systemPermissions) {
            const exists = await Permission.findOne({ code: permData.code });
            if (!exists) {
                await Permission.create(permData);
                console.log(`Seeded Permission: ${permData.code}`);
            } else {
                console.log(`Permission already exists: ${permData.code}`);
            }
        }

        console.log("Permission Seeding Complete!");
        process.exit();
    } catch (error) {
        console.error("Error with seeding data:", error);
        process.exit(1);
    }
};

seedPermissions();
