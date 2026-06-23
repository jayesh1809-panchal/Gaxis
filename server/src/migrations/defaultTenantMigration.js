const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");

// List of all models that need tenantId assigned
const modelsToUpdate = [
    "User",
    "Role",
    "Permission",
    "Application",
    "Session",
    "AuditLog",
    "RefreshToken",
    "MfaSettings",
    "UserRole",
    "RolePermission",
    "UserApplicationAccess",
    "AuthorizationCode"
];

const migrateToDefaultTenant = async () => {
    try {
        console.log("🚀 Starting Multi-Tenant Migration");
        
        // 1. Create or Find DEFAULT_TENANT
        let defaultTenant = await Tenant.findOne({ code: "DEFAULT" });
        if (!defaultTenant) {
            defaultTenant = await Tenant.create({
                name: "Default Organization",
                code: "DEFAULT",
                slug: "default",
                status: "active"
            });
            console.log(`✅ Created DEFAULT_TENANT with ID: ${defaultTenant._id}`);
        } else {
            console.log(`✅ Found existing DEFAULT_TENANT with ID: ${defaultTenant._id}`);
        }

        // 2. Loop through all existing collections and backfill tenantId
        for (const modelName of modelsToUpdate) {
            try {
                require(`../models/${modelName}`);
                const Model = mongoose.model(modelName);
                
                const result = await Model.updateMany(
                    { tenantId: { $exists: false } },
                    { $set: { tenantId: defaultTenant._id } }
                );

                console.log(`✅ [${modelName}] Updated ${result.modifiedCount} records with DEFAULT_TENANT`);
            } catch (err) {
                console.error(`❌ Failed to update model: ${modelName}. Model might not be loaded yet. Details: ${err.message}`);
            }
        }
        
        console.log("🎉 Multi-Tenant Migration Complete!");

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        mongoose.disconnect();
    }
};

// Execute if run directly
if (require.main === module) {
    require("dotenv").config();
    const connectDB = require("../config/db");
    connectDB().then(() => {
        migrateToDefaultTenant();
    });
} else {
    module.exports = migrateToDefaultTenant;
}
