const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Role = require("../models/Role");

// Load env vars
dotenv.config({ path: __dirname + "/../../.env" });

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding...");

        const systemRoles = [
            {
                name: "System Administrator",
                code: "SYSTEM_ADMIN",
                description: "Super user with access to all ecosystem features",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
            {
                name: "Employee",
                code: "EMPLOYEE",
                description: "Standard employee with baseline access to self-service features",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
            {
                name: "HR Administrator",
                code: "HR_ADMIN",
                description: "Administrator for the HR module",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
            {
                name: "CRM Administrator",
                code: "CRM_ADMIN",
                description: "Administrator for the CRM module",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
            {
                name: "Project Manager",
                code: "PROJECT_MANAGER",
                description: "Manager for project management tools",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
            {
                name: "Finance Manager",
                code: "FINANCE_MANAGER",
                description: "Manager for financial tools and data",
                isSystemRole: true,
                roleType: "SYSTEM",
            },
        ];

        for (const roleData of systemRoles) {
            const exists = await Role.findOne({ code: roleData.code });
            if (!exists) {
                await Role.create(roleData);
                console.log(`Seeded Role: ${roleData.code}`);
            } else {
                console.log(`Role already exists: ${roleData.code}`);
            }
        }

        console.log("Role Seeding Complete!");
        process.exit();
    } catch (error) {
        console.error("Error with seeding data:", error);
        process.exit(1);
    }
};

seedRoles();
