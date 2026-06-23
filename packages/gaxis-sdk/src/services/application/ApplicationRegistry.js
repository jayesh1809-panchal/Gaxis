/**
 * Application Registry
 * Central persistence layer for tracking all G-Axis applications.
 */
class ApplicationRegistry {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    _getKey() {
        return `gaxis_applications_manifest`;
    }

    async getAll() {
        const str = await this.sdk.storage.get(this._getKey());
        return str ? JSON.parse(str) : [];
    }

    async get(applicationId) {
        const apps = await this.getAll();
        return apps.find(a => a.applicationId === applicationId) || null;
    }

    async save(applicationRecord) {
        const apps = await this.getAll();
        const existingIdx = apps.findIndex(a => a.applicationId === applicationRecord.applicationId);
        
        if (existingIdx > -1) {
            apps[existingIdx] = applicationRecord;
        } else {
            apps.push(applicationRecord);
        }

        await this.sdk.storage.set(this._getKey(), JSON.stringify(apps));
        return applicationRecord;
    }

    async delete(applicationId) {
        let apps = await this.getAll();
        apps = apps.filter(a => a.applicationId !== applicationId);
        await this.sdk.storage.set(this._getKey(), JSON.stringify(apps));
    }
}

module.exports = ApplicationRegistry;
