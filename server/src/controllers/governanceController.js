const OrganizationUnit = require("../models/OrganizationUnit");
const ApprovalWorkflow = require("../models/ApprovalWorkflow");
const ApprovalRequest = require("../models/ApprovalRequest");
const GovernancePolicy = require("../models/GovernancePolicy");
const DelegatedAdmin = require("../models/DelegatedAdmin");
const ComplianceRecord = require("../models/ComplianceRecord");
const User = require("../models/User");
const governanceEngine = require("../services/governanceEngine");
const auditService = require("../services/auditService");
const auditEvents = require("../constants/auditEvents");

// ==========================================
// Organization Units
// ==========================================

exports.getOrganizationUnits = async (req, res) => {
    try {
        const units = await OrganizationUnit.find({ tenantId: req.tenant._id })
            .populate("members", "firstName lastName email department designation")
            .populate("parentId", "name code");
        res.status(200).json({ success: true, data: units });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createOrganizationUnit = async (req, res) => {
    try {
        const { name, code, type, parentId, members, description } = req.body;
        const unit = new OrganizationUnit({
            tenantId: req.tenant._id,
            name,
            code,
            type,
            parentId: parentId || null,
            members: members || [],
            description
        });
        await unit.save();
        res.status(201).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOrganizationUnit = async (req, res) => {
    try {
        const { name, code, type, parentId, members, description } = req.body;
        const unit = await OrganizationUnit.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenant._id },
            { name, code, type, parentId: parentId || null, members: members || [], description },
            { returnDocument: 'after', runValidators: true }
        );
        if (!unit) return res.status(404).json({ success: false, message: "Organization Unit not found" });
        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteOrganizationUnit = async (req, res) => {
    try {
        const unit = await OrganizationUnit.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!unit) return res.status(404).json({ success: false, message: "Organization Unit not found" });
        res.status(200).json({ success: true, message: "Organization Unit deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Approval Workflows
// ==========================================

exports.getApprovalWorkflows = async (req, res) => {
    try {
        const workflows = await ApprovalWorkflow.find({ tenantId: req.tenant._id });
        res.status(200).json({ success: true, data: workflows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createApprovalWorkflow = async (req, res) => {
    try {
        const { name, description, triggerType, steps, status } = req.body;
        const workflow = new ApprovalWorkflow({
            tenantId: req.tenant._id,
            name,
            description,
            triggerType,
            steps,
            status
        });
        await workflow.save();
        res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateApprovalWorkflow = async (req, res) => {
    try {
        const workflow = await ApprovalWorkflow.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenant._id },
            req.body,
            { returnDocument: 'after', runValidators: true }
        );
        if (!workflow) return res.status(404).json({ success: false, message: "Approval Workflow not found" });
        res.status(200).json({ success: true, data: workflow });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteApprovalWorkflow = async (req, res) => {
    try {
        const workflow = await ApprovalWorkflow.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!workflow) return res.status(404).json({ success: false, message: "Approval Workflow not found" });
        res.status(200).json({ success: true, message: "Workflow deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Approval Requests
// ==========================================

exports.getApprovalRequests = async (req, res) => {
    try {
        const query = { tenantId: req.tenant._id };
        if (req.query.status) {
            query.status = req.query.status;
        }
        const requests = await ApprovalRequest.find(query)
            .populate("requesterId", "firstName lastName email")
            .populate("workflowId")
            .sort("-createdAt");
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApprovalRequestById = async (req, res) => {
    try {
        const request = await ApprovalRequest.findOne({ _id: req.params.id, tenantId: req.tenant._id })
            .populate("requesterId", "firstName lastName email")
            .populate("workflowId")
            .populate("approvalsReceived.userId", "firstName lastName email");
        if (!request) return res.status(404).json({ success: false, message: "Approval Request not found" });
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reviewApprovalRequest = async (req, res) => {
    try {
        const { decision, comments } = req.body;
        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({ success: false, message: "Decision must be approved or rejected" });
        }

        const request = await ApprovalRequest.findOne({ _id: req.params.id, tenantId: req.tenant._id })
            .populate("workflowId");
        if (!request) return res.status(404).json({ success: false, message: "Approval Request not found" });
        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Request has already been processed" });
        }

        const workflow = request.workflowId;
        const currentStepConfig = workflow.steps.find(s => s.stepNumber === request.currentStep);

        if (!currentStepConfig) {
            return res.status(500).json({ success: false, message: "Workflow configuration error" });
        }

        // Verify if active user is authorized to approve this step
        // We look up if user is in userIds list or holds the authorized administrative delegation
        const delegatedAdmins = await DelegatedAdmin.find({
            tenantId: req.tenant._id,
            userId: req.user._id
        });
        const delegatedRoles = delegatedAdmins.map(d => d.adminRole);

        const isUserAuthorized = currentStepConfig.approverUserIds.some(uid => uid.toString() === req.user._id.toString()) ||
            currentStepConfig.approverRole === "GLOBAL_ADMIN" ||
            delegatedRoles.includes(currentStepConfig.approverRole) ||
            req.user.roleType === "SYSTEM"; // System admin acts as override bypass

        if (!isUserAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to approve this step" });
        }

        // Check if user already reviewed this step (prevent duplicates)
        const alreadyReviewed = request.approvalsReceived.some(a => 
            a.userId.toString() === req.user._id.toString() && a.stepNumber === request.currentStep
        );
        if (alreadyReviewed) {
            return res.status(400).json({ success: false, message: "You have already reviewed this step" });
        }

        request.approvalsReceived.push({
            userId: req.user._id,
            stepNumber: request.currentStep,
            decision,
            comments,
            timestamp: new Date()
        });

        if (decision === "rejected") {
            request.status = "rejected";
            request.decisionNotes = comments;

            await auditService.logEvent({
                tenantId: req.tenant._id,
                actorUserId: req.user._id,
                action: auditEvents.APPROVAL_REJECTED,
                category: "Governance",
                resourceType: "ApprovalRequest",
                resourceId: request._id,
                metadata: { requestType: request.requestType, reason: request.reason, comments }
            });

            await request.save();
            return res.status(200).json({ success: true, message: "Request rejected successfully", data: request });
        }

        // Check if step approvals are met
        const stepApprovalsCount = request.approvalsReceived.filter(a => 
            a.stepNumber === request.currentStep && a.decision === "approved"
        ).length;

        if (stepApprovalsCount >= (currentStepConfig.minApprovalsRequired || 1)) {
            // Step is fully approved. Check if there is a next step.
            const nextStepConfig = workflow.steps.find(s => s.stepNumber === request.currentStep + 1);
            if (nextStepConfig) {
                request.currentStep += 1;
            } else {
                // Final step complete. Execute the action!
                request.status = "approved";
                await request.save();

                // Trigger actual backend commit
                try {
                    await governanceEngine.executeApprovedAction(request._id);
                } catch (executionErr) {
                    return res.status(500).json({
                        success: false,
                        message: `Execution of approved action failed: ${executionErr.message}`,
                        error: executionErr.message
                    });
                }

                await auditService.logEvent({
                    tenantId: req.tenant._id,
                    actorUserId: req.user._id,
                    action: auditEvents.APPROVAL_GRANTED,
                    category: "Governance",
                    resourceType: "ApprovalRequest",
                    resourceId: request._id
                });
            }
        }

        await request.save();
        res.status(200).json({ success: true, message: "Review processed successfully", data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Governance Policies
// ==========================================

exports.getPolicies = async (req, res) => {
    try {
        const policies = await GovernancePolicy.find({ tenantId: req.tenant._id })
            .populate("approvalWorkflowId");
        res.status(200).json({ success: true, data: policies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPolicy = async (req, res) => {
    try {
        const { name, code, description, actionType, approvalWorkflowId, enforcementRules } = req.body;
        const policy = new GovernancePolicy({
            tenantId: req.tenant._id,
            name,
            code,
            description,
            actionType,
            approvalWorkflowId: approvalWorkflowId || null,
            enforcementRules: enforcementRules || { allowedIPs: [], allowedTimeWindows: [], requireMfa: false }
        });
        await policy.save();

        await auditService.logEvent({
            tenantId: req.tenant._id,
            actorUserId: req.user._id,
            action: auditEvents.POLICY_CREATED,
            category: "Governance",
            resourceType: "GovernancePolicy",
            resourceId: policy._id,
            metadata: { code, actionType }
        });

        res.status(201).json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePolicy = async (req, res) => {
    try {
        const policy = await GovernancePolicy.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenant._id },
            req.body,
            { returnDocument: 'after', runValidators: true }
        );
        if (!policy) return res.status(404).json({ success: false, message: "Policy not found" });

        await auditService.logEvent({
            tenantId: req.tenant._id,
            actorUserId: req.user._id,
            action: auditEvents.POLICY_UPDATED,
            category: "Governance",
            resourceType: "GovernancePolicy",
            resourceId: policy._id
        });

        res.status(200).json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePolicy = async (req, res) => {
    try {
        const policy = await GovernancePolicy.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!policy) return res.status(404).json({ success: false, message: "Policy not found" });
        res.status(200).json({ success: true, message: "Policy deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Delegated Administration
// ==========================================

exports.getDelegatedAdmins = async (req, res) => {
    try {
        const admins = await DelegatedAdmin.find({ tenantId: req.tenant._id })
            .populate("userId", "firstName lastName email")
            .populate("scopeId");
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.assignDelegatedAdmin = async (req, res) => {
    try {
        const { userId, adminRole, scopeType, scopeId } = req.body;
        const assignment = new DelegatedAdmin({
            tenantId: req.tenant._id,
            userId,
            adminRole,
            scopeType,
            scopeId: scopeId || null,
            assignedBy: req.user._id
        });
        await assignment.save();

        await auditService.logEvent({
            tenantId: req.tenant._id,
            actorUserId: req.user._id,
            action: auditEvents.DELEGATED_ADMIN_ASSIGNED,
            category: "Delegation",
            resourceType: "DelegatedAdmin",
            resourceId: assignment._id,
            metadata: { userId, adminRole, scopeType }
        });

        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.revokeDelegatedAdmin = async (req, res) => {
    try {
        const assignment = await DelegatedAdmin.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id });
        if (!assignment) return res.status(404).json({ success: false, message: "Delegation assignment not found" });
        res.status(200).json({ success: true, message: "Delegated admin access revoked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Compliance & Exception Records
// ==========================================

exports.getComplianceRecords = async (req, res) => {
    try {
        const records = await ComplianceRecord.find({ tenantId: req.tenant._id })
            .populate("policyId")
            .populate("reviewedBy", "firstName lastName email")
            .sort("-createdAt");
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createComplianceRecord = async (req, res) => {
    try {
        const { recordType, title, description, severity, policyId, expirationDate } = req.body;
        const record = new ComplianceRecord({
            tenantId: req.tenant._id,
            recordType,
            title,
            description,
            severity,
            policyId: policyId || null,
            expirationDate: expirationDate || null
        });
        await record.save();
        res.status(201).json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reviewComplianceRecord = async (req, res) => {
    try {
        const { status, reviewNotes } = req.body;
        const record = await ComplianceRecord.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenant._id },
            { status, reviewNotes, reviewedBy: req.user._id, reviewedAt: new Date() },
            { returnDocument: 'after', runValidators: true }
        );
        if (!record) return res.status(404).json({ success: false, message: "Compliance record not found" });

        await auditService.logEvent({
            tenantId: req.tenant._id,
            actorUserId: req.user._id,
            action: auditEvents.COMPLIANCE_REVIEW_COMPLETED,
            category: "Compliance",
            resourceType: "ComplianceRecord",
            resourceId: record._id,
            metadata: { status }
        });

        res.status(200).json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getComplianceMetrics = async (req, res) => {
    try {
        const tenantId = req.tenant._id;
        
        // Aggregate totals
        const totalRecords = await ComplianceRecord.countDocuments({ tenantId });
        const openViolations = await ComplianceRecord.countDocuments({ tenantId, recordType: "control_failure", status: "open" });
        const activeExceptions = await ComplianceRecord.countDocuments({ tenantId, recordType: "policy_override", status: "approved_exception" });
        const totalPolicies = await GovernancePolicy.countDocuments({ tenantId, status: "active" });

        // Calculate average approval cycle time (mock/simulated or computed from completed requests)
        const completedRequests = await ApprovalRequest.find({ tenantId, status: "completed" });
        let averageCycleTimeMinutes = 0;
        if (completedRequests.length > 0) {
            const totalDurationMs = completedRequests.reduce((sum, r) => {
                const start = new Date(r.createdAt).getTime();
                const end = new Date(r.updatedAt).getTime();
                return sum + (end - start);
            }, 0);
            averageCycleTimeMinutes = Math.round((totalDurationMs / completedRequests.length) / 60000);
        }

        res.status(200).json({
            success: true,
            data: {
                totalPolicies,
                openViolations,
                activeExceptions,
                averageCycleTimeMinutes,
                recordTypeBreakdown: {
                    audit_review: await ComplianceRecord.countDocuments({ tenantId, recordType: "audit_review" }),
                    policy_override: await ComplianceRecord.countDocuments({ tenantId, recordType: "policy_override" }),
                    control_failure: await ComplianceRecord.countDocuments({ tenantId, recordType: "control_failure" }),
                    risk_alert: await ComplianceRecord.countDocuments({ tenantId, recordType: "risk_alert" })
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
