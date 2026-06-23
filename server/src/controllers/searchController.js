const globalSearchEngine = require("../services/globalSearchEngine");

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        const results = await globalSearchEngine.search(q, req.user.tenantId);
        
        res.status(200).json({ 
            success: true, 
            count: results.length,
            data: results 
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};
