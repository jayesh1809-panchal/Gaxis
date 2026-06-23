/**
 * Application Registry
 * Dynamically registers connected applications for SLO broadcasting.
 */
class ApplicationRegistry {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
  }
  _getKey() {
    return `gaxis_slo_apps`;
  }

  /**
   * Retrieves all registered applications.
   */
  async getApplications() {
    const str = await this.sdk.storage.get(this._getKey());
    return str ? JSON.parse(str) : [];
  }

  /**
   * Registers a new application to receive SLO webhooks.
   */
  async registerApplication(appDetails) {
    const apps = await this.getApplications();
    const existingIdx = apps.findIndex(a => a.applicationId === appDetails.applicationId);
    const payload = {
      applicationId: appDetails.applicationId,
      applicationName: appDetails.applicationName,
      logoutEndpoint: appDetails.logoutEndpoint,
      healthEndpoint: appDetails.healthEndpoint,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString()
    };
    if (existingIdx > -1) {
      apps[existingIdx] = payload;
    } else {
      apps.push(payload);
    }
    await this.sdk.storage.set(this._getKey(), JSON.stringify(apps));
    this.sdk.logger.info(`Registered Application for SLO: ${payload.applicationId}`);
    return payload;
  }
  async deregisterApplication(applicationId) {
    let apps = await this.getApplications();
    apps = apps.filter(a => a.applicationId !== applicationId);
    await this.sdk.storage.set(this._getKey(), JSON.stringify(apps));
  }
}
module.exports = ApplicationRegistry;