const fs = require('fs/promises');
const path = require('path');

class EnvironmentProvisioner {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    async provision(applicationRecord, clientSecret) {
        const envPath = path.resolve(process.cwd(), '.env.gaxis');
        
        const envContent = `
# ==========================================
# G-AXIS ECOSYSTEM AUTO-GENERATED CONFIG
# App: ${applicationRecord.applicationName}
# Generated At: ${new Date().toISOString()}
# ==========================================

GAXIS_CLIENT_ID=${applicationRecord.applicationId}
GAXIS_CLIENT_SECRET=${clientSecret}
GAXIS_BASE_URL=${this.sdk.config.baseUrl || 'http://localhost:5000'}
GAXIS_APP_CODE=${applicationRecord.applicationCode}
`;

        try {
            // Create .env.gaxis. We don't blindly overwrite .env to prevent nuking existing configs,
            // instead we output .env.gaxis that developers can source or rename.
            await fs.writeFile(envPath, envContent.trim() + '\n');
            this.sdk.logger.info(`Generated G-Axis environment file at ${envPath}`);
        } catch (error) {
            throw new Error(`Failed to provision .env: ${error.message}`);
        }
    }
}

module.exports = EnvironmentProvisioner;
