const crypto = require('crypto');

/**
 * Generate a secure random string (used for PKCE code verifier and state)
 * @param {number} length
 * @returns {string}
 */
function generateRandomString(length = 64) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate PKCE Code Challenge from Verifier
 * @param {string} codeVerifier
 * @returns {string}
 */
function generateCodeChallenge(codeVerifier) {
    return crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

module.exports = {
    generateRandomString,
    generateCodeChallenge
};
