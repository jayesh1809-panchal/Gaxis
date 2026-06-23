const AIConversation = require("../models/AIConversation");
const AIAction = require("../models/AIAction");
const AIExecutionLog = require("../models/AIExecutionLog");
const aiOrchestrator = require("../services/aiOrchestrator");
const auditEvents = require("../constants/auditEvents");
const { logEvent } = require("../services/auditService");

exports.sendMessage = async (req, res) => {
    console.log("AI CONTROLLER HIT");
    try {
        const { text, conversationId } = req.body;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;

        const start = Date.now();

        // 1. Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await AIConversation.findOne({ _id: conversationId, tenantId, userId });
        }
        if (!conversation) {
            conversation = new AIConversation({ tenantId, userId, title: text.substring(0, 30) });
        }

        // Add user message
        conversation.messages.push({
            sender: "user",
            text: text
        });

        // 2. Process via Orchestrator
        const { text: assistantText, suggestedActions } = await aiOrchestrator.processMessage(
            tenantId,
            userId,
            text,
            req.user.permissions
        );

        // Add assistant message
        conversation.messages.push({
            sender: "assistant",
            text: assistantText,
            suggestedActions: suggestedActions
        });

        await conversation.save();

        const latencyMs = Date.now() - start;

        // 3. Log execution
        await AIExecutionLog.create({
            tenantId,
            userId,
            query: text,
            actionTaken: suggestedActions.length > 0 ? "DRAFTED_ACTIONS" : "ANSWERED_QUERY",
            latencyMs,
            outcome: "success"
        });

        await logEvent({
            req,
            tenantId,
            actorUserId: userId,
            action: auditEvents.AI_QUERY_EXECUTED,
            category: "AI Copilot",
            metadata: { query: text, latencyMs },
            status: "success"
        });

        res.status(200).json({
            success: true,
            conversation,
            assistantMessage: {
                text: assistantText,
                suggestedActions
            }
        });
    } catch (error) {
        console.error("Error in AI sendMessage:", error);
        res.status(500).json({ success: false, message: "AI Assistant encountered an error." });
    }
};

exports.executeAction = async (req, res) => {
    try {
        const { actionId } = req.params;
        const tenantId = req.user.tenantId;

        const action = await aiOrchestrator.executeAction(actionId, tenantId, req.user);

        // Audit Event
        await logEvent({
            req,
            tenantId,
            actorUserId: req.user.id,
            action: auditEvents.AI_ACTION_EXECUTED,
            category: "AI Copilot",
            metadata: { actionId, type: action.actionType },
            status: "success"
        });

        res.status(200).json({
            success: true,
            action
        });
    } catch (error) {
        console.error("Error executing AI Action:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const conversations = await AIConversation.find({ tenantId: req.user.tenantId, userId: req.user.id })
            .sort({ updatedAt: -1 })
            .select("title updatedAt");
        res.status(200).json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getConversationById = async (req, res) => {
    try {
        const conversation = await AIConversation.findOne({ _id: req.params.id, tenantId: req.user.tenantId, userId: req.user.id })
            .populate("messages.suggestedActions");
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }
        res.status(200).json({ success: true, conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getExecutionLogs = async (req, res) => {
    try {
        const logs = await AIExecutionLog.find({ tenantId: req.user.tenantId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("userId", "firstName lastName email");
        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
