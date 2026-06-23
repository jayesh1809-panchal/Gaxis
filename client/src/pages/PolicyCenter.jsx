import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaGavel, FaPlus, FaTrash, FaEdit, FaSlidersH, FaToggleOn, FaToggleOff } from "react-icons/fa";
import {
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    getApprovalWorkflows,
    createApprovalWorkflow,
    updateApprovalWorkflow,
    deleteApprovalWorkflow
} from "../services/governanceService";
import LoadingSpinner from "../components/LoadingSpinner";

const PolicyCenter = () => {
    const [policies, setPolicies] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("policies"); // "policies" or "workflows"

    // Modal states
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [editingWorkflow, setEditingWorkflow] = useState(null);

    // Form data states
    const [policyForm, setPolicyForm] = useState({
        name: "",
        code: "",
        description: "",
        actionType: "APPLICATION_INSTALLATION",
        approvalWorkflowId: "",
        allowedIPs: "",
        requireMfa: false
    });

    const [workflowForm, setWorkflowForm] = useState({
        name: "",
        description: "",
        triggerType: "APPLICATION_INSTALLATION",
        steps: [{ stepNumber: 1, approverRole: "GLOBAL_ADMIN", minApprovalsRequired: 1 }]
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [policiesRes, workflowsRes] = await Promise.all([
                getPolicies(),
                getApprovalWorkflows()
            ]);
            setPolicies(policiesRes.data.data);
            setWorkflows(workflowsRes.data.data);
        } catch (error) {
            console.error("Failed to load policies data", error);
            toast.error("Failed to load policy configurations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ==========================================
    // Policy Handlers
    // ==========================================
    const openPolicyModal = (policy = null) => {
        if (policy) {
            setEditingPolicy(policy);
            setPolicyForm({
                name: policy.name,
                code: policy.code,
                description: policy.description || "",
                actionType: policy.actionType,
                approvalWorkflowId: policy.approvalWorkflowId?._id || policy.approvalWorkflowId || "",
                allowedIPs: policy.enforcementRules?.allowedIPs?.join(", ") || "",
                requireMfa: policy.enforcementRules?.requireMfa || false
            });
        } else {
            setEditingPolicy(null);
            setPolicyForm({
                name: "",
                code: "",
                description: "",
                actionType: "APPLICATION_INSTALLATION",
                approvalWorkflowId: "",
                allowedIPs: "",
                requireMfa: false
            });
        }
        setIsPolicyModalOpen(true);
    };

    const handlePolicySubmit = async (e) => {
        e.preventDefault();
        const ips = policyForm.allowedIPs
            ? policyForm.allowedIPs.split(",").map(ip => ip.trim()).filter(ip => ip)
            : [];
        const payload = {
            name: policyForm.name,
            code: policyForm.code,
            description: policyForm.description,
            actionType: policyForm.actionType,
            approvalWorkflowId: policyForm.approvalWorkflowId || null,
            enforcementRules: {
                allowedIPs: ips,
                allowedTimeWindows: [], // Defaults to empty
                requireMfa: policyForm.requireMfa
            }
        };

        try {
            if (editingPolicy) {
                await updatePolicy(editingPolicy._id, payload);
                toast.success("Policy updated successfully");
            } else {
                await createPolicy(payload);
                toast.success("Policy created successfully");
            }
            setIsPolicyModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save policy");
        }
    };

    const handleTogglePolicyStatus = async (policy) => {
        try {
            const nextStatus = policy.status === "active" ? "inactive" : "active";
            await updatePolicy(policy._id, { status: nextStatus });
            toast.success(`Policy status updated to ${nextStatus}`);
            loadData();
        } catch (err) {
            toast.error("Failed to toggle policy status");
        }
    };

    const handleDeletePolicy = async (id) => {
        if (!window.confirm("Are you sure you want to delete this policy?")) return;
        try {
            await deletePolicy(id);
            toast.success("Policy deleted successfully");
            loadData();
        } catch (err) {
            toast.error("Failed to delete policy");
        }
    };

    // ==========================================
    // Workflow Handlers
    // ==========================================
    const openWorkflowModal = (workflow = null) => {
        if (workflow) {
            setEditingWorkflow(workflow);
            setWorkflowForm({
                name: workflow.name,
                description: workflow.description || "",
                triggerType: workflow.triggerType,
                steps: workflow.steps.map(s => ({
                    stepNumber: s.stepNumber,
                    approverRole: s.approverRole,
                    minApprovalsRequired: s.minApprovalsRequired
                }))
            });
        } else {
            setEditingWorkflow(null);
            setWorkflowForm({
                name: "",
                description: "",
                triggerType: "APPLICATION_INSTALLATION",
                steps: [{ stepNumber: 1, approverRole: "GLOBAL_ADMIN", minApprovalsRequired: 1 }]
            });
        }
        setIsWorkflowModalOpen(true);
    };

    const handleWorkflowStepChange = (index, field, value) => {
        setWorkflowForm(prev => {
            const steps = [...prev.steps];
            steps[index][field] = value;
            return { ...prev, steps };
        });
    };

    const addWorkflowStep = () => {
        setWorkflowForm(prev => ({
            ...prev,
            steps: [
                ...prev.steps,
                { stepNumber: prev.steps.length + 1, approverRole: "GLOBAL_ADMIN", minApprovalsRequired: 1 }
            ]
        }));
    };

    const removeWorkflowStep = (index) => {
        if (workflowForm.steps.length === 1) return;
        setWorkflowForm(prev => {
            const steps = prev.steps.filter((_, idx) => idx !== index).map((s, idx) => ({
                ...s,
                stepNumber: idx + 1
            }));
            return { ...prev, steps };
        });
    };

    const handleWorkflowSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWorkflow) {
                await updateApprovalWorkflow(editingWorkflow._id, workflowForm);
                toast.success("Workflow updated successfully");
            } else {
                await createApprovalWorkflow(workflowForm);
                toast.success("Workflow created successfully");
            }
            setIsWorkflowModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save workflow");
        }
    };

    const handleDeleteWorkflow = async (id) => {
        if (!window.confirm("Are you sure you want to delete this workflow? All policies referencing it will stop triggering approvals.")) return;
        try {
            await deleteApprovalWorkflow(id);
            toast.success("Workflow deleted successfully");
            loadData();
        } catch (err) {
            toast.error("Failed to delete workflow");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaGavel className="text-blue-600 text-2xl" />
                        Policy & Workflow Center
                    </h1>
                    <p className="text-slate-500 mt-1">Configure compliance verification parameters and define multi-level approval hierarchies.</p>
                </div>
                {activeTab === "policies" ? (
                    <button
                        onClick={() => openPolicyModal(null)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                        <FaPlus className="text-xs" />
                        Create Governance Policy
                    </button>
                ) : (
                    <button
                        onClick={() => openWorkflowModal(null)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                        <FaPlus className="text-xs" />
                        Create Approval Workflow
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab("policies")}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === "policies"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Governance Policies
                </button>
                <button
                    onClick={() => setActiveTab("workflows")}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === "workflows"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Approval Workflows
                </button>
            </div>

            {/* Main Panel Content */}
            {activeTab === "policies" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {policies.length > 0 ? (
                        policies.map(policy => (
                            <div key={policy._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">{policy.code}</span>
                                        <button 
                                            onClick={() => handleTogglePolicyStatus(policy)}
                                            className="text-slate-400 hover:text-slate-600 text-lg transition-colors"
                                        >
                                            {policy.status === "active" ? <FaToggleOn className="text-emerald-500 text-xl" /> : <FaToggleOff className="text-slate-300 text-xl" />}
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{policy.name}</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{policy.description || "No description provided."}</p>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
                                        <div>
                                            <span className="font-semibold text-slate-500 block">Applies to Action:</span>
                                            <span className="font-mono uppercase font-bold text-slate-700">{policy.actionType.replace("_", " ")}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500 block">Approval Workflow:</span>
                                            <span className="font-semibold text-blue-600">{policy.approvalWorkflowId?.name || "None (Instant Action)"}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500 block">MFA Required:</span>
                                            <span>{policy.enforcementRules?.requireMfa ? "Yes" : "No"}</span>
                                        </div>
                                        {policy.enforcementRules?.allowedIPs && policy.enforcementRules.allowedIPs.length > 0 && (
                                            <div>
                                                <span className="font-semibold text-slate-500 block">Allowed IPs:</span>
                                                <span className="truncate block font-mono">{policy.enforcementRules.allowedIPs.join(", ")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 mt-5 pt-4 flex gap-2 justify-end">
                                    <button
                                        onClick={() => openPolicyModal(policy)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <FaEdit className="text-[10px]" />
                                        Edit Policy
                                    </button>
                                    <button
                                        onClick={() => handleDeletePolicy(policy._id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-1.5 px-3 rounded-lg text-xs border border-red-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <FaTrash className="text-[10px]" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white p-12 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl">
                            No governance policies configured. Click "Create Governance Policy" to add one.
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.length > 0 ? (
                        workflows.map(wf => (
                            <div key={wf._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Workflow Config</span>
                                        <h3 className="font-bold text-slate-900 text-lg mt-1">{wf.name}</h3>
                                        <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{wf.description || "No description provided."}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Approval Steps</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {wf.steps.map(step => (
                                                <div key={step.stepNumber} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 font-medium">
                                                    <span>Step {step.stepNumber}: <span className="font-semibold text-slate-800">{step.approverRole.replace("_", " ")}</span></span>
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-100 text-[10px]">
                                                        {step.minApprovalsRequired || 1} Sign-off{step.minApprovalsRequired > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 mt-5 pt-4 flex gap-2 justify-end">
                                    <button
                                        onClick={() => openWorkflowModal(wf)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <FaEdit className="text-[10px]" />
                                        Edit steps
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWorkflow(wf._id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-1.5 px-3 rounded-lg text-xs border border-red-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <FaTrash className="text-[10px]" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white p-12 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl">
                            No approval workflows configured. Click "Create Approval Workflow" to add one.
                        </div>
                    )}
                </div>
            )}

            {/* Policy Modal */}
            {isPolicyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">{editingPolicy ? "Edit Governance Policy" : "Create Governance Policy"}</h2>
                            <button onClick={() => setIsPolicyModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handlePolicySubmit}>
                            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Policy Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={policyForm.name}
                                            onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Audit Role Escalations"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Policy Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={policyForm.code}
                                            onChange={(e) => setPolicyForm({ ...policyForm, code: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="AUDIT_ROLE_ASSIGN"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        value={policyForm.description}
                                        onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        rows="2"
                                        placeholder="Add policy description..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Action Trigger Type</label>
                                        <select
                                            value={policyForm.actionType}
                                            onChange={(e) => setPolicyForm({ ...policyForm, actionType: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="APPLICATION_INSTALLATION">Application Installation</option>
                                            <option value="APPLICATION_REMOVAL">Application Removal</option>
                                            <option value="ROLE_ASSIGNMENT">Role Assignment</option>
                                            <option value="PERMISSION_ESCALATION">Permission Escalation</option>
                                            <option value="WORKFLOW_PUBLISHING">Workflow Publishing</option>
                                            <option value="SECRET_ROTATION">Secret Rotation</option>
                                            <option value="MARKETPLACE_PUBLISHING">Marketplace Publishing</option>
                                            <option value="SUBSCRIPTION_UPGRADE">Subscription Upgrade</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Workflow</label>
                                        <select
                                            value={policyForm.approvalWorkflowId}
                                            onChange={(e) => setPolicyForm({ ...policyForm, approvalWorkflowId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">None (Enforce Instant Policy Rules Only)</option>
                                            {workflows
                                                .filter(w => w.triggerType === policyForm.actionType)
                                                .map(w => (
                                                    <option key={w._id} value={w._id}>{w.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enforcement Rules</h4>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="requireMfa"
                                            checked={policyForm.requireMfa}
                                            onChange={(e) => setPolicyForm({ ...policyForm, requireMfa: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                        <label htmlFor="requireMfa" className="text-sm font-medium text-slate-700 cursor-pointer">Enforce Multi-Factor Authentication (MFA)</label>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Allowed IPs (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={policyForm.allowedIPs}
                                            onChange={(e) => setPolicyForm({ ...policyForm, allowedIPs: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="127.0.0.1, 192.168.1.100"
                                        />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to authorize any network location.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPolicyModalOpen(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-sm transition-colors"
                                >
                                    Save Policy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Workflow Modal */}
            {isWorkflowModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">{editingWorkflow ? "Edit Approval Steps" : "Create Approval Workflow"}</h2>
                            <button onClick={() => setIsWorkflowModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleWorkflowSubmit}>
                            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Workflow Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={workflowForm.name}
                                            onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Finance Review Route"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trigger Action Type</label>
                                        <select
                                            value={workflowForm.triggerType}
                                            onChange={(e) => setWorkflowForm({ ...workflowForm, triggerType: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="APPLICATION_INSTALLATION">Application Installation</option>
                                            <option value="APPLICATION_REMOVAL">Application Removal</option>
                                            <option value="ROLE_ASSIGNMENT">Role Assignment</option>
                                            <option value="PERMISSION_ESCALATION">Permission Escalation</option>
                                            <option value="WORKFLOW_PUBLISHING">Workflow Publishing</option>
                                            <option value="SECRET_ROTATION">Secret Rotation</option>
                                            <option value="MARKETPLACE_PUBLISHING">Marketplace Publishing</option>
                                            <option value="SUBSCRIPTION_UPGRADE">Subscription Upgrade</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        value={workflowForm.description}
                                        onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        rows="2"
                                        placeholder="Add workflow path details..."
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Stages</h4>
                                        <button
                                            type="button"
                                            onClick={addWorkflowStep}
                                            className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <FaPlus className="text-[10px]" />
                                            Add Stage
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {workflowForm.steps.map((step, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-center relative group">
                                                <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {step.stepNumber}
                                                </span>
                                                
                                                <div className="grid grid-cols-2 gap-3 flex-grow">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Approver Scope</label>
                                                        <select
                                                            value={step.approverRole}
                                                            onChange={(e) => handleWorkflowStepChange(idx, "approverRole", e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="GLOBAL_ADMIN">Global Admin</option>
                                                            <option value="TENANT_ADMIN">Tenant Admin</option>
                                                            <option value="SECURITY_ADMIN">Security Admin</option>
                                                            <option value="BUSINESS_UNIT_ADMIN">Business Unit Admin</option>
                                                            <option value="DEPARTMENT_ADMIN">Department Admin</option>
                                                            <option value="AUDIT_ADMIN">Audit Admin</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Required Approvals</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            required
                                                            value={step.minApprovalsRequired}
                                                            onChange={(e) => handleWorkflowStepChange(idx, "minApprovalsRequired", parseInt(e.target.value))}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeWorkflowStep(idx)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove Step"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsWorkflowModalOpen(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-sm transition-colors"
                                >
                                    Save Workflow
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PolicyCenter;
