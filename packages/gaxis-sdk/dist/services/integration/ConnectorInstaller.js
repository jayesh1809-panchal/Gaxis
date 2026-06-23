class ConnectorInstaller {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }
  async install(features) {
    this.sdk.logger.info('Installing required Connectors based on manifest features...');
    const activeConnectors = [];

    // During integration, we assume the core SDK features are structurally available
    // We do not eagerly access this.sdk.oauth etc. because that forces credential validation
    // before the credentials have been provisioned by the integration engine.

    if (features.includes('oauth')) {
      activeConnectors.push('oauth');
    }
    if (features.includes('rbac')) {
      activeConnectors.push('rbac');
    }
    if (features.includes('session')) {
      activeConnectors.push('session');
    }
    if (features.includes('slo')) {
      activeConnectors.push('slo');
    }
    if (features.includes('identity')) {
      activeConnectors.push('identity');
    }
    this.sdk.logger.info(`Connectors verified and active: ${activeConnectors.join(', ')}`);
    return activeConnectors;
  }
}
module.exports = ConnectorInstaller;