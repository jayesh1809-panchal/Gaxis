const ComplianceRecord = require("../models/ComplianceRecord");
const WorkflowExecution = require("../models/WorkflowExecution");
const AIAction = require("../models/AIAction");

/**
 * AI Orchestrator - Evaluates queries, interacts with G-Axis ecosystem, drafts actions.
 */
class AIOrchestrator {
    
    /**
     * Parses the intent and responds with text + suggested actions.
     */
    async processMessage(tenantId, userId, text, permissions = []) {
        const lowerText = text.toLowerCase();
        let responseText = "I'm not sure how to help with that. Try asking about 'failed workflows' or 'access denied'.";
        let suggestedActions = [];

        // Intent: Access Denied / Compliance
        if (lowerText.includes("access denied") || lowerText.includes("compliance")) {
            // Check permission (simulated basic check)
            const records = await ComplianceRecord.find({
                tenantId,
                status: "open",
                severity: { $in: ["high", "critical"] }
            }).limit(5);

            if (records.length > 0) {
                responseText = `I found ${records.length} open compliance records with high/critical severity that might explain access issues:\n` +
                    records.map(r => `- [${r.severity.toUpperCase()}] ${r.title}`).join("\n");
            } else {
                responseText = "I didn't find any open high/critical compliance records. Access might be denied due to direct role restrictions.";
            }
        }
        
        // Intent: Failed workflows
        else if (lowerText.includes("failed workflow") || lowerText.includes("workflow fail")) {
            const failedExecutions = await WorkflowExecution.find({
                tenantId,
                status: "failed"
            }).sort({ createdAt: -1 }).limit(5);

            if (failedExecutions.length > 0) {
                responseText = `Here are the latest failed workflows:\n` +
                    failedExecutions.map(e => `- Execution started at ${e.startedAt}: ${e.errorLogs.length ? e.errorLogs[0].message : "Unknown error"}`).join("\n");
            } else {
                responseText = "Great news! I didn't find any recently failed workflows.";
            }
        }
        
        // Intent: Draft an action (e.g., Create Onboarding Workflow)
        else if (lowerText.includes("create onboarding workflow") || lowerText.includes("draft onboarding workflow")) {
            // Draft an AI Action
            const action = new AIAction({
                tenantId,
                userId,
                actionType: "CREATE_WORKFLOW_DRAFT",
                description: "Create an employee onboarding workflow",
                payload: {
                    name: "Employee Onboarding (AI Drafted)",
                    description: "Automatically drafted onboarding workflow.",
                    triggerType: "event",
                    triggerConfig: { eventName: "user.created" },
                    nodes: [
                        { id: "step1", type: "action", name: "Send Welcome Email" }
                    ]
                },
                status: "drafted"
            });
            await action.save();

            suggestedActions.push(action._id);
            responseText = "I've drafted an Employee Onboarding workflow for you. You can review and apply it below.";
        }

        return {
            text: responseText,
            suggestedActions
        };
    }

    /**
     * Executes an approved or auto-approved AI Action.
     */
    async executeAction(actionId, tenantId, user) {
        const action = await AIAction.findOne({ _id: actionId, tenantId });
        if (!action) {
            throw new Error("Action not found.");
        }

        if (action.status === "executed") {
            throw new Error("Action already executed.");
        }

        // Simulating execution
        if (action.actionType === "CREATE_WORKFLOW_DRAFT") {
            // In a real system, we'd call the workflow engine to save it.
            action.status = "executed";
            action.executionResult = { success: true, message: "Workflow created successfully." };
            await action.save();
        }

        return action;
    }
}

module.exports = new AIOrchestrator();
