const EcosystemContext = require("../models/EcosystemContext");

class ContextEngine {
    /**
     * Retrieve or initialize the active context for a user
     */
    async getContext(userId) {
        let context = await EcosystemContext.findOne({ userId });
        if (!context) {
            context = await EcosystemContext.create({
                userId,
                sessionData: {
                    activeAppId: null,
                    activeEntityId: null,
                    entityType: null,
                    sharedState: {}
                }
            });
        }
        return context;
    }

    /**
     * Update the context when the user interacts with an entity or switches apps
     */
    async updateContext(userId, newSessionData) {
        const context = await this.getContext(userId);
        
        // Merge existing session data with the new data
        context.sessionData = { ...context.sessionData, ...newSessionData };
        context.lastUpdated = new Date();
        
        return await context.save();
    }

    /**
     * Clear the current context (e.g., on logout or explicit clear)
     */
    async clearContext(userId) {
        const context = await this.getContext(userId);
        context.sessionData = {
            activeAppId: null,
            activeEntityId: null,
            entityType: null,
            sharedState: {}
        };
        return await context.save();
    }
}

module.exports = new ContextEngine();
