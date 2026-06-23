const User = require("../models/User");
const Workflow = require("../models/WorkflowDefinition");
const EcosystemRegistry = require("../models/EcosystemRegistry");

class GlobalSearchEngine {
    /**
     * Federated search across multiple G-Axis modules simultaneously.
     */
    async search(queryStr, tenantId) {
        if (!queryStr || queryStr.trim().length < 2) {
            return [];
        }

        const regex = new RegExp(queryStr, "i");

        // 1. Search Users (Identity Module)
        const userPromise = User.find({
            tenantId,
            $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { jobTitle: regex }
            ]
        }).limit(5).select("firstName lastName email jobTitle avatar").lean();

        // 2. Search Workflows (Workflow Module)
        const workflowPromise = Workflow.find({
            tenantId,
            $or: [
                { name: regex },
                { description: regex }
            ]
        }).limit(5).select("name description status").lean();

        // 3. Search Ecosystem Apps (Registry Module)
        const appPromise = EcosystemRegistry.find({
            status: "active",
            $or: [
                { name: regex },
                { description: regex },
                { appId: regex }
            ]
        }).limit(5).select("name description appId icon").lean();

        // Execute all searches concurrently
        const [users, workflows, apps] = await Promise.all([
            userPromise,
            workflowPromise,
            appPromise
        ]);

        // Format and aggregate results
        const results = [];

        users.forEach(u => results.push({
            id: u._id,
            type: "user",
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.jobTitle || u.email,
            icon: "FaUser",
            url: `/users/${u._id}`
        }));

        workflows.forEach(w => results.push({
            id: w._id,
            type: "workflow",
            title: w.name,
            subtitle: w.description || "Workflow Automation",
            icon: "FaProjectDiagram",
            url: `/workflows/${w._id}`
        }));

        apps.forEach(a => results.push({
            id: a._id,
            type: "app",
            title: a.name,
            subtitle: a.description,
            icon: a.icon || "FaCube",
            url: a.launchUrl || `/app/${a.appId}`
        }));

        return results;
    }
}

module.exports = new GlobalSearchEngine();
