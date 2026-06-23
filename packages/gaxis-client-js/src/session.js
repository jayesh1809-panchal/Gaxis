import { KEYS } from './constants.js';

export class SessionManager {
    constructor(storage) {
        this.storage = storage;
    }

    setSessionData({ user, permissions, roles }) {
        console.log("SESSION DATA", {
            user,
            permissions,
            roles
        });
        if (user) this.storage.set(KEYS.USER, user);
        if (permissions) this.storage.set(KEYS.PERMISSIONS, permissions);
        if (roles) this.storage.set(KEYS.ROLES, roles);
    }

    getUser() {
        return this.storage.get(KEYS.USER);
    }

    getPermissions() {
        return this.storage.get(KEYS.PERMISSIONS) || [];
    }

    getRoles() {
        return this.storage.get(KEYS.ROLES) || [];
    }

    hasPermission(permission) {
        const permissions = this.getPermissions();
        return permissions.includes(permission);
    }

    hasRole(role) {
        const roles = this.getRoles();
        return roles.includes(role);
    }

    clearSession() {
        this.storage.remove(KEYS.USER);
        this.storage.remove(KEYS.PERMISSIONS);
        this.storage.remove(KEYS.ROLES);
    }
}
