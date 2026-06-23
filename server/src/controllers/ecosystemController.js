const ecosystemOSEngine = require("../services/ecosystemOSEngine");
const contextEngine = require("../services/contextEngine");

exports.getWorkspace = async (req, res) => {
    try {
        const workspace = await ecosystemOSEngine.getWorkspace(req.user._id);
        const availableApps = await ecosystemOSEngine.getAllAvailableApps();
        
        res.status(200).json({ 
            success: true, 
            data: { workspace, availableApps } 
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.togglePin = async (req, res) => {
    try {
        const { registryId } = req.body;
        const workspace = await ecosystemOSEngine.togglePinnedApp(req.user._id, registryId);
        res.status(200).json({ success: true, data: workspace });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
};

exports.getContext = async (req, res) => {
    try {
        const context = await contextEngine.getContext(req.user._id);
        res.status(200).json({ success: true, data: context });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateContext = async (req, res) => {
    try {
        const { sessionData } = req.body;
        const context = await contextEngine.updateContext(req.user._id, sessionData);
        res.status(200).json({ success: true, data: context });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
};
