const ConfigLoader = require('./config/loader');
const LoggerService = require('./services/loggerService');
const GAxisEventEmitter = require('./utils/events');
const VersionManager = require('./utils/version');
const { MemoryStorage } = require('./utils/storage');
const IdentityManager = require('./identity/IdentityManager');
const OAuthClient = require('./oauth/OAuthClient');
const AuthorizationEngine = require('./authz/AuthorizationEngine');
const SessionManager = require('./services/session/SessionManager');
const SingleLogoutManager = require('./services/slo/SingleLogoutManager');
const ApplicationLifecycleManager = require('./services/application/ApplicationLifecycleManager');
const IntegrationManager = require('./services/integration/IntegrationManager');
const MarketplaceEngine = require('./marketplace/MarketplaceEngine');

/**
 * Core SDK Class
 * Phase 8.1 Foundation: Manages configuration, logging, events, and providers.
 */
class GAxisSDK {
    constructor(userConfig = {}) {
        // 1. Validate and Load Configuration
        this.config = ConfigLoader.load(userConfig);

        // 2. Initialize Core Services
        this.logger = new LoggerService(this.config.loggerOptions);
        this.events = new GAxisEventEmitter();
        this.storage = this.config.storage || new MemoryStorage();

        // 3. Initialize Version Tracking
        this.version = VersionManager.getVersion();

        // 4. Hook Registry
        this.hooks = {
            onUserProvision: this.config.onUserProvision || null,
            onRoleSync: this.config.onRoleSync || null
        };

        // 10. Initialize Auto Application Lifecycle Engine
        this.application = new ApplicationLifecycleManager(this);

        // 11. Initialize Zero-Code Plug & Play Engine
        this.integration = new IntegrationManager(this);

        // 12. Initialize Marketplace Engine
        this.marketplace = new MarketplaceEngine(this);

        this.logger.info(`GAxisSDK initialized successfully (v${this.version})`);
        this.events.emitEvent(this.events.events.SDK_READY, { version: this.version });
    }

    // ==========================================
    // LAZY LOADED ENGINES (Validates Credentials)
    // ==========================================

    _validateCredentials() {
        const ValidationEngine = require('./utils/validation');
        ValidationEngine.validateCredentials(this.config);
    }

    get oauth() {
        if (!this._oauth) {
            this._validateCredentials();
            this._oauth = new OAuthClient(this);
        }
        return this._oauth;
    }

    get identity() {
        if (!this._identity) {
            this._identity = new IdentityManager(this);
        }
        return this._identity;
    }

    get authz() {
        if (!this._authz) {
            this._validateCredentials();
            this._authz = new AuthorizationEngine(this);
        }
        return this._authz;
    }

    get session() {
        if (!this._session) {
            this._validateCredentials();
            this._session = new SessionManager(this);
        }
        return this._session;
    }

    get slo() {
        if (!this._slo) {
            this._slo = new SingleLogoutManager(this);
        }
        return this._slo;
    }

    /**
     * Returns the generic Node HTTP provider
     */
    nodeProvider() {
        const nodeProvider = require('./providers/nodeProvider');
        return nodeProvider(this);
    }

    /**
     * Returns the Express.js middleware and router provider
     */
    expressProvider() {
        const expressProvider = require('./providers/expressProvider');
        return expressProvider(this);
    }

    // ==========================================
    // INTEGRATION ENGINE PUBLIC APIS
    // ==========================================

    async integrate(options) {
        return this.integration.integrate(options);
    }

    async validateIntegration(applicationId) {
        return this.integration.validateIntegration(applicationId);
    }

    async repairIntegration(applicationId) {
        return this.integration.repairIntegration(applicationId);
    }
}

module.exports = GAxisSDK;
