const { ValidationError } = require('./errors');

/**
 * Validation Engine
 * Strictly validates all configuration before the SDK is allowed to boot.
 */
class ValidationEngine {
    static validateConfig(config) {
        const errors = [];

        // 2. Base URL format validation (if provided)
        try {
            if (config.baseUrl) new URL(config.baseUrl);
        } catch (e) {
            errors.push('baseUrl must be a valid absolute URL');
        }

        try {
            if (config.redirectUri) new URL(config.redirectUri);
        } catch (e) {
            errors.push('redirectUri must be a valid absolute URL');
        }

        // 3. Optional hook validation
        const hooks = ['onUserProvision', 'onRoleSync', 'onSingleLogout'];
        hooks.forEach(hook => {
            if (config[hook] !== undefined && config[hook] !== null && typeof config[hook] !== 'function') {
                errors.push(`${hook} must be a function if provided`);
            }
        });

        if (errors.length > 0) {
            throw new ValidationError('SDK Configuration Validation Failed', { errors });
        }

        return true;
    }

    static validateCredentials(config) {
        const errors = [];
        const requiredStrings = ['baseUrl', 'clientId', 'clientSecret', 'redirectUri'];
        requiredStrings.forEach(field => {
            if (!config[field] || typeof config[field] !== 'string') {
                errors.push(`Missing or invalid required configuration field: ${field}`);
            }
        });

        if (errors.length > 0) {
            throw new ValidationError('SDK Credentials Validation Failed', { errors });
        }
        return true;
    }
}

module.exports = ValidationEngine;
