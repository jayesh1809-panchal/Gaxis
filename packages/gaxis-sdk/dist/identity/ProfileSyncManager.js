/**
 * Profile Sync Manager
 * Handles deep syncing of profile data (avatar, name, metadata)
 * between the G-Axis token payload and the local database.
 */
class ProfileSyncManager {
  constructor(sdkInstance, adapter, mapper) {
    this.sdk = sdkInstance;
    this.adapter = adapter;
    this.mapper = mapper;
  }

  /**
   * Syncs a local user's profile with the latest claims from G-Axis.
   * @param {Object} localUser 
   * @param {Object} idTokenPayload 
   */
  async syncProfile(localUser, idTokenPayload) {
    try {
      const mappedData = this.mapper.mapToLocal(idTokenPayload);

      // We assume the adapter uses the primary key or unique identifier for updates.
      // The adapter implementation is responsible for resolving `localUser` to an ID.
      const localUserId = localUser.id || localUser._id;
      this.sdk.logger.debug(`Syncing profile for local user: ${localUserId}`);
      const updatedUser = await this.adapter.update(localUserId, mappedData);
      this.sdk.events.emitEvent(this.sdk.events.events.PROFILE_SYNCED, {
        localUserId
      });
      return updatedUser;
    } catch (error) {
      this.sdk.logger.error(`Profile sync failed: ${error.message}`);
      throw error;
    }
  }
}
module.exports = ProfileSyncManager;