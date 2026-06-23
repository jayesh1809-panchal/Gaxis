export class StorageManager {
    constructor(prefix = '') {
        this.prefix = prefix;
    }

    set(key, value) {
        if (value === null || value === undefined) {
            this.remove(key);
            return;
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    get(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
            return JSON.parse(item);
        } catch (e) {
            return item;
        }
    }

    remove(key) {
        localStorage.removeItem(key);
    }

    clearAll(keysObj) {
        Object.values(keysObj).forEach(key => {
            this.remove(key);
        });
    }
}
