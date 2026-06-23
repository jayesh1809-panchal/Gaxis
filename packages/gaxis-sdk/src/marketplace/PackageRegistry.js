/**
 * Package Registry
 * Central persistence controller for published marketplace packages.
 */
class PackageRegistry {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
    }

    _getKey() {
        return 'gaxis_marketplace_registry';
    }

    async getAll() {
        const str = await this.sdk.storage.get(this._getKey());
        return str ? JSON.parse(str) : [];
    }

    async get(packageName) {
        const packages = await this.getAll();
        return packages.find(p => p.name === packageName) || null;
    }

    async save(packageRecord) {
        const packages = await this.getAll();
        const existingIdx = packages.findIndex(p => p.name === packageRecord.name);
        
        if (existingIdx > -1) {
            packages[existingIdx] = packageRecord;
        } else {
            packages.push(packageRecord);
        }

        await this.sdk.storage.set(this._getKey(), JSON.stringify(packages));
        return packageRecord;
    }

    async delete(packageName) {
        let packages = await this.getAll();
        packages = packages.filter(p => p.name !== packageName);
        await this.sdk.storage.set(this._getKey(), JSON.stringify(packages));
    }
}

module.exports = PackageRegistry;
