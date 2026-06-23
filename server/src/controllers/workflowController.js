const WorkflowDefinition = require("../models/WorkflowDefinition");
const WorkflowExecution = require("../models/WorkflowExecution");
const workflowEventDispatcher = require("../services/workflowEventDispatcher");
const auditService = require("../services/auditService");

exports.getWorkflows = async (req, res) => {
    try {
        const workflows = await WorkflowDefinition.find({ tenantId: req.tenant._id })
            .populate('createdBy', 'firstName lastName email');
        res.status(200).json({ success: true, data: workflows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getWorkflowById = async (req, res) => {
    try {
        const workflow = await WorkflowDefinition.findOne({ _id: req.params.id, tenantId: req.tenant._id });
        if (!workflow) return res.status(404).json({ success: false, message: "Workflow not found" });
        res.status(200).json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createWorkflow = async (req, res) => {
    try {
        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(req.tenant._id, "WORKFLOW_PUBLISHING", req.user, { workflowData: req.body }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                req.tenant._id,
                req.user._id,
                "WORKFLOW_PUBLISHING",
                { workflowData: req.body },
                req.body.reason || "Request workflow creation approval",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Workflow publishing requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const workflow = new WorkflowDefinition({
            ...req.body,
            tenantId: req.tenant._id,
            createdBy: req.user._id
        });
        await workflow.save();

        await auditService.logEvent({
            req,
            action: "WORKFLOW_CREATED",
            resourceType: "WorkflowDefinition",
            resourceId: workflow._id,
            metadata: { code: workflow.code }
        });

        res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateWorkflow = async (req, res) => {
    try {
        const workflowId = req.params.id;
        const governanceEngine = require("../services/governanceEngine");
        const approvalCheck = await governanceEngine.checkApprovalRequired(req.tenant._id, "WORKFLOW_PUBLISHING", req.user, { workflowId, workflowData: req.body }, req);
        if (approvalCheck.pendingApproval) {
            await governanceEngine.initiateApproval(
                req.tenant._id,
                req.user._id,
                "WORKFLOW_PUBLISHING",
                { workflowId, workflowData: req.body },
                req.body.reason || "Request workflow update approval",
                approvalCheck.policy,
                approvalCheck.workflow
            );
            return res.status(202).json({
                success: true,
                message: "Workflow updating requires administrative approval. Request submitted.",
                pendingApproval: true
            });
        }

        const workflow = await WorkflowDefinition.findOneAndUpdate(
            { _id: workflowId, tenantId: req.tenant._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!workflow) return res.status(404).json({ success: false, message: "Workflow not found" });

        await auditService.logEvent({
            req,
            action: "WORKFLOW_UPDATED",
            resourceType: "WorkflowDefinition",
            resourceId: workflow._id
        });

        res.status(200).json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteWorkflow = async (req, res) => {
    try {
        const workflow = await WorkflowDefinition.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!workflow) return res.status(404).json({ success: false, message: "Workflow not found" });

        await auditService.logEvent({
            req,
            action: "WORKFLOW_DELETED",
            resourceType: "WorkflowDefinition",
            resourceId: workflow._id
        });

        res.status(200).json({ success: true, message: "Workflow deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getExecutions = async (req, res) => {
    try {
        const query = { tenantId: req.tenant._id };
        if (req.query.workflowId) {
            query.workflowId = req.query.workflowId;
        }

        const executions = await WorkflowExecution.find(query)
            .populate('workflowId', 'name code')
            .sort({ startedAt: -1 })
            .limit(50);
            
        res.status(200).json({ success: true, data: executions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getExecutionById = async (req, res) => {
    try {
        const execution = await WorkflowExecution.findOne({ _id: req.params.id, tenantId: req.tenant._id })
            .populate('workflowId');
        if (!execution) return res.status(404).json({ success: false, message: "Execution not found" });
        
        res.status(200).json({ success: true, data: execution });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Public/SDK Endpoint to emit external events into the system
 * POST /api/workflows/events
 */
exports.emitExternalEvent = async (req, res) => {
    try {
        // App must authenticate. Ideally, they use Client Credentials OAuth token.
        // req.application or req.user.applicationId would be set by auth middleware.
        // For simplicity, assuming standard authentication exists on this route.

        const { eventType, payload } = req.body;
        if (!eventType) return res.status(400).json({ success: false, message: "eventType is required" });

        const source = req.user.applicationId ? req.user.applicationId.toString() : 'EXTERNAL_API';

        // Dispatch asynchronously
        workflowEventDispatcher.publish(req.tenant._id, source, eventType, payload);

        res.status(202).json({ success: true, message: "Event received and queued" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
