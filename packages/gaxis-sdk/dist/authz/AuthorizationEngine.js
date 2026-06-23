const RoleMapper = require('./RoleMapper');
const PermissionMapper = require('./PermissionMapper');
const RoleSyncManager = require('./RoleSyncManager');
const PermissionSyncManager = require('./PermissionSyncManager');

/**
 * Authorization Engine Facade
 * Coordinates RBAC syncing and policy enforcement.
 */
class AuthorizationEngine {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;
    this.roleMapper = new RoleMapper(this.sdk);
    this.permissionMapper = new PermissionMapper(this.sdk);
    this.roleSync = new RoleSyncManager(this.sdk, this.roleMapper);
    this.permissionSync = new PermissionSyncManager(this.sdk, this.permissionMapper);
    this._registerEventListeners();
  }

  /**
   * Automatically hooks into the event system to sync roles/permissions on auth events.
   */
  _registerEventListeners() {
    // Assuming tokenData contains an id_token we can decode, 
    // or the payload is passed along with localUserId.
    this.sdk.events.on(this.sdk.events.events.AUTH_SUCCESS, async data => {
      const {
        localUserId,
        tokenPayload
      } = data;
      if (localUserId && tokenPayload) {
        if (tokenPayload.roles) await this.syncRoles(localUserId, tokenPayload.roles);
        if (tokenPayload.permissions) await this.syncPermissions(localUserId, tokenPayload.permissions);
      }
    });
  }
  async syncRoles(localUserId, gaxisRoles) {
    return this.roleSync.syncRoles(localUserId, gaxisRoles);
  }
  async syncPermissions(localUserId, gaxisPermissions) {
    return this.permissionSync.syncPermissions(localUserId, gaxisPermissions);
  }
  async getRoles(localUserId) {
    return this.roleSync.getRoles(localUserId);
  }
  async getPermissions(localUserId) {
    return this.permissionSync.getPermissions(localUserId);
  }

  /**
   * Checks if a user has a specific local role.
   * @param {string|number} localUserId 
   * @param {string} localRole 
   */
  async hasRole(localUserId, localRole) {
    const roles = await this.getRoles(localUserId);
    return roles.includes(localRole);
  }

  /**
   * Checks if a user has a specific local permission.
   * @param {string|number} localUserId 
   * @param {string} localPermission 
   */
  async hasPermission(localUserId, localPermission) {
    const permissions = await this.getPermissions(localUserId);
    return permissions.includes(localPermission);
  }

  /**
   * Complex policy check.
   * @param {string|number} localUserId 
   * @param {Object} policy - { roles: [], permissions: [], requireAll: false }
   */
  async can(localUserId, policy) {
    const roles = await this.getRoles(localUserId);
    const permissions = await this.getPermissions(localUserId);
    const hasRequiredRole = policy.roles ? policy.roles.some(r => roles.includes(r)) : true;
    const hasRequiredPerm = policy.permissions ? policy.permissions.some(p => permissions.includes(p)) : true;
    if (policy.requireAll) {
      return hasRequiredRole && hasRequiredPerm;
    }
    return hasRequiredRole || hasRequiredPerm;
  }
}
module.exports = AuthorizationEngine;