/**
 * Base User Adapter Interface
 * Defines the contract all adapters must follow for Identity Provisioning.
 */
class BaseUserAdapter {
    async findByGAxisId(gaxisUserId) {
        throw new Error("Method 'findByGAxisId' must be implemented.");
    }

    async findByEmail(email) {
        throw new Error("Method 'findByEmail' must be implemented.");
    }

    async create(mappedData) {
        throw new Error("Method 'create' must be implemented.");
    }

    async update(localUserId, mappedData) {
        throw new Error("Method 'update' must be implemented.");
    }

    async link(localUserId, gaxisUserId) {
        throw new Error("Method 'link' must be implemented.");
    }

    async unlink(localUserId) {
        throw new Error("Method 'unlink' must be implemented.");
    }
}

module.exports = BaseUserAdapter;
