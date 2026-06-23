/**
 * Universal Node.js Provider
 * Handles raw HTTP incoming requests (req, res) without depending on Express or other frameworks.
 * 
 * Phase 8.1 Foundation: Only scaffolds the routing engine.
 * 
 * @param {import('../GAxisSDK')} sdkInstance 
 */
function nodeProvider(sdkInstance) {
    return async function gaxisHandler(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;

        sdkInstance.logger.debug(`NodeProvider processing path: ${path}`);

        if (path === '/login') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "GAxis Node Provider: Login Endpoint Scaffolded" }));
            return true;
        }

        if (path === '/callback') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "GAxis Node Provider: Callback Endpoint Scaffolded" }));
            return true;
        }

        if (path === '/logout') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "GAxis Node Provider: Logout Endpoint Scaffolded" }));
            return true;
        }

        return false; // Handled by next middleware or 404
    };
}

module.exports = nodeProvider;
