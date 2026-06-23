const { ConfigurationError } = require('../utils/errors');
const ValidationEngine = require('../utils/validation');

/**
 * Configuration Loader
 * Merges explicit user configuration with environment variables securely.
 */
class ConfigLoader {
    static load(userConfig = {}) {
        try {
            const mergedConfig = {
                // System Environment fallbacks
                baseUrl: userConfig.baseUrl || process.env.GAXIS_URL,
                clientId: userConfig.clientId || process.env.GAXIS_CLIENT_ID,
                clientSecret: userConfig.clientSecret || process.env.GAXIS_CLIENT_SECRET,
                redirectUri: userConfig.redirectUri || process.env.GAXIS_REDIRECT_URI,
                
                // Options
                successRedirect: userConfig.successRedirect || null,
                strictSessionHeartbeat: userConfig.strictSessionHeartbeat !== false,
                
                // Hooks
                onUserProvision: userConfig.onUserProvision || null,
                onRoleSync: userConfig.onRoleSync || null,
                onSingleLogout: userConfig.onSingleLogout || null,
                
                // Identity & Provisioning
                provisioningMode: userConfig.provisioningMode || 'AUTO_CREATE',
                userAdapter: userConfig.userAdapter || null,
                identityMapping: userConfig.identityMapping || null,

                // RBAC Sync Config
                roleMapping: userConfig.roleMapping || {},
                permissionMapping: userConfig.permissionMapping || {},

                // Session Config
                sessionIdleTimeout: userConfig.sessionIdleTimeout || 1800,
                sessionAbsoluteTimeout: userConfig.sessionAbsoluteTimeout || 86400,
                allowMultipleSessions: userConfig.allowMultipleSessions !== false,
                enableDeviceTracking: userConfig.enableDeviceTracking !== false,
                enableActivityTracking: userConfig.enableActivityTracking !== false,

                // SLO Config
                enableSLO: userConfig.enableSLO !== false,
                enableGlobalLogout: userConfig.enableGlobalLogout !== false,
                enableCrossAppLogout: userConfig.enableCrossAppLogout !== false,
                logoutPropagationTimeout: userConfig.logoutPropagationTimeout || 5000,

                // Services Config
                storage: userConfig.storage || null,
                loggerOptions: userConfig.loggerOptions || { enabled: true, level: 'info' }
            };

            // Validate the deeply merged configuration
            ValidationEngine.validateConfig(mergedConfig);

            return mergedConfig;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new ConfigurationError(`Invalid SDK configuration: ${error.details.errors.join(', ')}`);
            }
            throw error;
        }
    }
}

module.exports = ConfigLoader;
