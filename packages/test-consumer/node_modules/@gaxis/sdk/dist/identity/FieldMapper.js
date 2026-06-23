/**
 * Dynamic Field Mapping Engine
 * Maps standard OIDC claims from G-Axis to the local application's database fields.
 */
class FieldMapper {
  constructor(sdkInstance) {
    this.sdk = sdkInstance;

    // Default mappings (OIDC Claim -> Local DB Field)
    this.mappingConfig = this.sdk.config.identityMapping || {
      gaxisUserId: 'gaxisUserId',
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
      avatar: 'picture',
      status: 'status'
    };
  }

  /**
   * Maps the incoming OIDC payload into a structured local DB payload.
   * @param {Object} idTokenPayload 
   * @returns {Object} Mapped fields for DB insertion/updating
   */
  mapToLocal(idTokenPayload) {
    const localData = {};

    // Map standard fields based on config
    for (const [localField, oidcClaim] of Object.entries(this.mappingConfig)) {
      if (localField === 'gaxisUserId') {
        localData[localField] = idTokenPayload.sub;
      } else if (idTokenPayload[oidcClaim] !== undefined) {
        localData[localField] = idTokenPayload[oidcClaim];
      }
    }

    // Default fallbacks if missing but expected
    if (!localData.email && idTokenPayload.email) {
      localData.email = idTokenPayload.email;
    }
    return localData;
  }
}
module.exports = FieldMapper;