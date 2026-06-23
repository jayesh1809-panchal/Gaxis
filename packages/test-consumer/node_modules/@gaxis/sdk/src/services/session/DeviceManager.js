const { v4: uuidv4 } = require('uuid');
const SessionEvents = require('./SessionEvents');

/**
 * Device Manager
 * Extracts fingerprint details and manages trusted devices natively via SDK Storage.
 */
class DeviceManager {
    constructor(sdkInstance) {
        this.sdk = sdkInstance;
        this.enabled = this.sdk.config.enableDeviceTracking !== false;
    }

    _getDeviceKey(deviceId) {
        return `gaxis_device_${deviceId}`;
    }

    /**
     * Registers a new device fingerprint from request headers.
     * @param {Object} req 
     * @returns {Promise<Object>} Device payload
     */
    async registerDevice(req) {
        if (!this.enabled) return { deviceId: 'untracked' };

        // In a real implementation, a deviceId might be passed from the client via a persistent cookie.
        // If not, we generate a new one based on the fingerprint.
        const deviceId = req.cookies?.gaxis_device_id || req.headers['x-device-id'] || uuidv4();
        
        const devicePayload = {
            deviceId,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            status: 'UNKNOWN', // TRUSTED, UNKNOWN, BLOCKED
            registeredAt: new Date().toISOString()
        };

        const existingDeviceStr = await this.sdk.storage.get(this._getDeviceKey(deviceId));
        
        if (!existingDeviceStr) {
            await this.sdk.storage.set(this._getDeviceKey(deviceId), JSON.stringify(devicePayload));
            this.sdk.events.emitEvent(SessionEvents.DEVICE_REGISTERED, { deviceId });
            this.sdk.logger.info(`New device registered: ${deviceId}`);
            return devicePayload;
        }

        return JSON.parse(existingDeviceStr);
    }

    async getDevice(deviceId) {
        const str = await this.sdk.storage.get(this._getDeviceKey(deviceId));
        return str ? JSON.parse(str) : null;
    }

    async trustDevice(deviceId) {
        const dev = await this.getDevice(deviceId);
        if (dev) {
            dev.status = 'TRUSTED';
            await this.sdk.storage.set(this._getDeviceKey(deviceId), JSON.stringify(dev));
            this.sdk.events.emitEvent(SessionEvents.DEVICE_TRUSTED, { deviceId });
        }
    }

    async blockDevice(deviceId) {
        const dev = await this.getDevice(deviceId);
        if (dev) {
            dev.status = 'BLOCKED';
            await this.sdk.storage.set(this._getDeviceKey(deviceId), JSON.stringify(dev));
            this.sdk.events.emitEvent(SessionEvents.DEVICE_BLOCKED, { deviceId });
        }
    }
}

module.exports = DeviceManager;
