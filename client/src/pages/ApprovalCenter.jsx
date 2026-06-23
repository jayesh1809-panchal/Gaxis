import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaCheckDouble, FaCheck, FaTimes, FaUser, FaClock, FaEye, FaChevronRight } from "react-icons/fa";
import { getApprovalRequests, getApprovalRequestById, reviewApprovalRequest } from "../services/governanceService";
import LoadingSpinner from "../components/LoadingSpinner";

const ApprovalCenter = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" or "completed"
    
    // Review form state
    const [decision, setDecision] = useState("approved");
    const [comments, setComments] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const statusFilter = activeTab === "pending" ? "pending" : "";
            const { data } = await getApprovalRequests(statusFilter);
            
            // If completed tab is selected, we filter out pending ones locally
            const filtered = activeTab === "completed" 
                ? data.data.filter(r => r.status !== "pending")
                : data.data.filter(r => r.status === "pending");
            
            setRequests(filtered);
        } catch (error) {
            console.error("Failed to load approval requests", error);
            toast.error("Failed to load approval requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
        setSelectedRequest(null);
    }, [activeTab]);

    const handleSelectRequest = async (id) => {
        try {
            setDetailsLoading(true);
            const { data } = await getApprovalRequestById(id);
            setSelectedRequest(data.data);
            setComments("");
        } catch (error) {
            toast.error("Failed to load request details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        
        try {
            setSubmitting(true);
            await reviewApprovalRequest(selectedRequest._id, { decision, comments });
            toast.success(`Request successfully ${decision === "approved" ? "approved" : "rejected"}`);
            setSelectedRequest(null);
            loadRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || "Review processing failed");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
            case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "completed": return "bg-blue-50 text-blue-700 border-blue-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const renderPayloadDetails = (payload, type) => {
        try {
            switch (type) {
                case "APPLICATION_INSTALLATION":
                    return (
                        <div className="space-y-1 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-500">Marketplace App ID:</span> {payload.marketplaceAppId}</p>
                            {payload.customRedirectUris && (
                                <p><span className="font-semibold text-slate-500">Redirect URIs:</span> {payload.customRedirectUris.join(", ")}</p>
                            )}
                        </div>
                    );
                case "ROLE_ASSIGNMENT":
                    return (
                        <div className="space-y-1 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-500">Target User ID:</span> {payload.userId}</p>
                            <p><span className="font-semibold text-slate-500">Role IDs:</span> {payload.roleIds.join(", ")}</p>
                        </div>
                    );
                case "SECRET_ROTATION":
                    return (
                        <div className="space-y-1 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-500">Application ID:</span> {payload.applicationId}</p>
                            <p><span className="font-semibold text-slate-500">Grace Period:</span> {payload.gracePeriodHours || 24} hours</p>
                        </div>
                    );
                case "SUBSCRIPTION_UPGRADE":
                    return (
                        <div className="space-y-1 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-500">App ID:</span> {payload.marketplaceAppId}</p>
                            <p><span className="font-semibold text-slate-500">Plan ID:</span> {payload.planId}</p>
                        </div>
                    );
                default:
                    return <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
            }
        } catch (err) {
            return <span className="text-slate-500 text-xs">Invalid payload structure.</span>;
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaCheckDouble className="text-blue-600 text-2xl" />
                        Approval Center
                    </h1>
                    <p className="text-slate-500 mt-1">Review organizational requests, approve system updates, and verify compliance audits.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === "pending"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Pending Approvals
                </button>
                <button
                    onClick={() => setActiveTab("completed")}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === "completed"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Completed/History
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">Requests List</h2>
                    {requests.length > 0 ? (
                        requests.map(req => (
                            <div
                                key={req._id}
                                onClick={() => handleSelectRequest(req._id)}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                                    selectedRequest && selectedRequest._id === req._id
                                    ? "bg-blue-50/50 border-blue-300 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            {req.requestType.replace("_", " ")}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{req.reason}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                                        <FaUser className="text-[10px]" />
                                        <span>{req.requesterId?.firstName} {req.requesterId?.lastName}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 mt-4 pt-3 text-[10px] text-slate-400 font-semibold">
                                    <span className="flex items-center gap-1">
                                        <FaClock />
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-0.5 hover:text-blue-500">
                                        Details
                                        <FaChevronRight className="text-[8px]" />
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl">
                            No requests found.
                        </div>
                    )}
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Request Details</h2>
                    {detailsLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-24 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : selectedRequest ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                            {/* Summary Box */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                                <div>
                                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Request ID: {selectedRequest._id}</span>
                                    <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedRequest.reason}</h3>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Requester Details */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requester info</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {selectedRequest.requesterId?.firstName} {selectedRequest.requesterId?.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500">{selectedRequest.requesterId?.email}</p>
                                        <p className="text-xs text-slate-400 mt-1">Submitted at: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Workflow Status */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Stages</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                        <p className="text-sm font-semibold text-slate-800">{selectedRequest.workflowId?.name}</p>
                                        <p className="text-xs text-slate-500">Current Step: {selectedRequest.currentStep} of {selectedRequest.workflowId?.steps?.length || 1}</p>
                                        {selectedRequest.workflowId?.steps && (
                                            <div className="flex gap-1.5 mt-2">
                                                {selectedRequest.workflowId.steps.map(step => (
                                                    <span
                                                        key={step.stepNumber}
                                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                                                            selectedRequest.currentStep > step.stepNumber
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : selectedRequest.currentStep === step.stepNumber && selectedRequest.status === "pending"
                                                            ? "bg-amber-400 border-amber-400 text-slate-800 animate-pulse"
                                                            : "bg-slate-200 border-slate-200 text-slate-500"
                                                        }`}
                                                        title={`Step ${step.stepNumber}: ${step.approverRole}`}
                                                    >
                                                        {step.stepNumber}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payload configuration parameters */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payload parameters</h4>
                                <div className="border border-slate-200 p-4 rounded-xl">
                                    {renderPayloadDetails(selectedRequest.payload, selectedRequest.requestType)}
                                </div>
                            </div>

                            {/* Reviews list history */}
                            {selectedRequest.approvalsReceived && selectedRequest.approvalsReceived.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sign-off history</h4>
                                    <div className="space-y-3">
                                        {selectedRequest.approvalsReceived.map((approval, idx) => (
                                            <div key={idx} className="flex gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                                                    {approval.userId?.firstName ? approval.userId.firstName[0] : "?"}
                                                </div>
                                                <div className="flex-grow space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {approval.userId?.firstName} {approval.userId?.lastName} (Step {approval.stepNumber})
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                            approval.decision === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                                        }`}>
                                                            {approval.decision}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600">{approval.comments || "No comments."}</p>
                                                    <p className="text-[9px] text-slate-400">{new Date(approval.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Decision action section */}
                            {selectedRequest.status === "pending" && (
                                <form onSubmit={handleReviewSubmit} className="border-t border-slate-100 pt-5 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submit decision</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setDecision("approved")}
                                            className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                decision === "approved"
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <FaCheck />
                                            Approve Action
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDecision("rejected")}
                                            className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                decision === "rejected"
                                                ? "bg-red-500 border-red-500 text-white shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <FaTimes />
                                            Reject Action
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Decision Comments</label>
                                        <textarea
                                            required
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            rows="3"
                                            placeholder="Specify reason or notes..."
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? "Processing..." : "Submit Review Decision"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center">
                            <FaEye className="text-slate-300 text-5xl mb-4" />
                            <span>Select a request from the list to view detailed configurations and review actions.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalCenter;
