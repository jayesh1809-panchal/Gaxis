const fs = require('fs/promises');
const path = require('path');

class ExpressAdapter {
    async bootstrap(applicationRecord) {
        const bootPath = path.resolve(process.cwd(), 'gaxis-bootstrap.js');
        const content = `
// ==========================================
// G-Axis Express Bootstrapper
// Automatically generated for ${applicationRecord.applicationName}
// ==========================================

const { GAxisSDK } = require('@gaxis/sdk');

const sdk = new GAxisSDK({
    baseUrl: process.env.GAXIS_BASE_URL,
    clientId: process.env.GAXIS_CLIENT_ID,
    clientSecret: process.env.GAXIS_CLIENT_SECRET
});

module.exports = function initializeGAxis(app) {
    // Mount SLO webhooks
    app.post('/slo/receive', (req, res) => {
        sdk.slo.receiveLogoutWebhook(req.body)
            .then(() => res.sendStatus(200))
            .catch(err => res.status(500).json({ error: err.message }));
    });
    
    // Mount Health Endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'UP', gaxis: 'connected' });
    });

    return sdk;
};
`;
        await fs.writeFile(bootPath, content.trim() + '\n');
        return bootPath;
    }
}

module.exports = ExpressAdapter;
