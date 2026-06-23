/**
 * Abstract Storage Interface
 * Can be extended by developers to use Redis, Memcached, etc.
 */
class StorageAbstraction {
  async get(key) {
    throw new Error("Method not implemented.");
  }
  async set(key, value, ttlSeconds) {
    throw new Error("Method not implemented.");
  }
  async delete(key) {
    throw new Error("Method not implemented.");
  }
}

/**
 * Default In-Memory Storage Implementation
 */
class MemoryStorage extends StorageAbstraction {
  constructor() {
    super();
    this.store = new Map();
  }
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key, value, ttlSeconds = null) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, {
      value,
      expiresAt
    });
  }
  async delete(key) {
    this.store.delete(key);
  }
}
module.exports = {
  StorageAbstraction,
  MemoryStorage
};