const BaseUserAdapter = require('./BaseUserAdapter');

/**
 * Custom User Adapter
 * Accepts functions from the host application to handle bespoke database setups.
 */
class CustomUserAdapter extends BaseUserAdapter {
    constructor(callbacks = {}) {
        super();
        this.callbacks = callbacks;
    }

    async findByGAxisId(gaxisUserId) {
        if (!this.callbacks.findByGAxisId) throw new Error("CustomUserAdapter: findByGAxisId not implemented");
        return this.callbacks.findByGAxisId(gaxisUserId);
    }

    async findByEmail(email) {
        if (!this.callbacks.findByEmail) throw new Error("CustomUserAdapter: findByEmail not implemented");
        return this.callbacks.findByEmail(email);
    }

    async create(mappedData) {
        if (!this.callbacks.create) throw new Error("CustomUserAdapter: create not implemented");
        return this.callbacks.create(mappedData);
    }

    async update(localUserId, mappedData) {
        if (!this.callbacks.update) throw new Error("CustomUserAdapter: update not implemented");
        return this.callbacks.update(localUserId, mappedData);
    }

    async link(localUserId, gaxisUserId) {
        if (!this.callbacks.link) throw new Error("CustomUserAdapter: link not implemented");
        return this.callbacks.link(localUserId, gaxisUserId);
    }

    async unlink(localUserId) {
        if (!this.callbacks.unlink) throw new Error("CustomUserAdapter: unlink not implemented");
        return this.callbacks.unlink(localUserId);
    }
}

module.exports = CustomUserAdapter;
