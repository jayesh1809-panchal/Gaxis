/**
 * Base class for all SDK Errors
 */
class GAxisError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration Errors (e.g. missing client ID)
 */
class ConfigurationError extends GAxisError {
  constructor(message, details = {}) {
    super(message, 'ERR_CONFIG', details);
  }
}

/**
 * Validation Errors (e.g. invalid URL format)
 */
class ValidationError extends GAxisError {
  constructor(message, details = {}) {
    super(message, 'ERR_VALIDATION', details);
  }
}

/**
 * Authentication Errors
 */
class AuthenticationError extends GAxisError {
  constructor(message, details = {}) {
    super(message, 'ERR_AUTH', details);
  }
}

/**
 * Network or API Errors
 */
class NetworkError extends GAxisError {
  constructor(message, details = {}) {
    super(message, 'ERR_NETWORK', details);
  }
}
module.exports = {
  GAxisError,
  ConfigurationError,
  ValidationError,
  AuthenticationError,
  NetworkError
};