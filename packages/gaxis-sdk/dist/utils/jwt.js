const jwt = require('jsonwebtoken');
const jose = require('jose'); // For browser-compatible JWT parsing if needed on frontend

/**
 * Verify a JWT token locally using the G-Axis Public Key.
 * In a real production setup, SDK would fetch the JWKS from G-Axis.
 * @param {string} token 
 * @param {string} publicKey 
 * @returns {object}
 */
function verifyToken(token, publicKey) {
  try {
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    });
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Decode a JWT without verifying the signature.
 * Useful for extracting claims on the frontend or before validation.
 * @param {string} token 
 * @returns {object}
 */
function decodeToken(token) {
  return jwt.decode(token);
}
module.exports = {
  verifyToken,
  decodeToken
};