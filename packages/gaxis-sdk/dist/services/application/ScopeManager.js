/**
 * Scope Manager
 * Auto-generates OAuth scopes for the application context.
 */
class ScopeManager {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }
  generateScopes(applicationCode) {
    if (!applicationCode) {
      throw new Error('Application Code is required to generate dynamic scopes.');
    }
    const code = applicationCode.toLowerCase();
    return ['openid', 'profile', 'email', `${code}.read`, `${code}.write`, `${code}.admin`];
  }
}
module.exports = ScopeManager;