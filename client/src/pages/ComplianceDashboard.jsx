import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaClipboardList, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaUserClock, FaPlus, FaBook } from "react-icons/fa";
import {
    getComplianceRecords,
    getComplianceMetrics,
    createComplianceRecord,
    reviewComplianceRecord,
    getPolicies
} from "../services/governanceService";
import LoadingSpinner from "../components/LoadingSpinner";

const ComplianceDashboard = () => {
    const [records, setRecords] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isOpen, setIsOpen] = useState(false);
    const [reviewingRecord, setReviewingRecord] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        status: "resolved",
        reviewNotes: ""
    });

    const [overrideForm, setOverrideForm] = useState({
        title: "",
        description: "",
        severity: "medium",
        policyId: "",
        durationDays: 1
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [recordsRes, metricsRes, policiesRes] = await Promise.all([
                getComplianceRecords(),
                getComplianceMetrics(),
                getPolicies()
            ]);
            setRecords(recordsRes.data.data);
            setMetrics(metricsRes.data.data);
            setPolicies(policiesRes.data.data);
        } catch (error) {
            console.error("Failed to load compliance dashboard data", error);
            toast.error("Failed to load compliance details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openReviewModal = (record) => {
        setReviewingRecord(record);
        setReviewForm({
            status: record.status === "open" ? "resolved" : record.status,
            reviewNotes: record.reviewNotes || ""
        });
        setIsOpen(true);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await reviewComplianceRecord(reviewingRecord._id, reviewForm);
            toast.success("Compliance alert updated successfully!");
            setIsOpen(false);
            loadData();
        } catch (error) {
            toast.error("Failed to update compliance record");
        }
    };

    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const openOverrideModal = () => {
        setOverrideForm({
            title: "",
            description: "",
            severity: "medium",
            policyId: policies[0]?._id || "",
            durationDays: 1
        });
        setIsOverrideOpen(true);
    };

    const handleOverrideSubmit = async (e) => {
        e.preventDefault();
        try {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + parseInt(overrideForm.durationDays));

            const payload = {
                recordType: "policy_override",
                title: overrideForm.title,
                description: overrideForm.description,
                severity: overrideForm.severity,
                policyId: overrideForm.policyId || null,
                status: "approved_exception",
                expirationDate: expDate
            };

            await createComplianceRecord(payload);
            toast.success("Temporary policy exception override created successfully!");
            setIsOverrideOpen(false);
            loadData();
        } catch (error) {
            toast.error("Failed to create policy override");
        }
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case "low": return "bg-slate-50 text-slate-600 border-slate-200";
            case "medium": return "bg-amber-50 text-amber-600 border-amber-200";
            case "high": return "bg-orange-50 text-orange-600 border-orange-200";
            case "critical": return "bg-red-50 text-red-600 border-red-200 animate-pulse";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaClipboardList className="text-blue-600 text-2xl" />
                        Compliance & Risk Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Audit active policies, handle risk violations, and authorize temporary exception bypasses.</p>
                </div>
                <button
                    onClick={openOverrideModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                    <FaPlus className="text-xs" />
                    Create Override Exception
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Policies */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl flex-shrink-0">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active Policies</span>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{metrics?.totalPolicies || 0}</div>
                    </div>
                </div>

                {/* Open Violations */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 text-xl flex-shrink-0">
                        <FaExclamationTriangle />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Open Violations</span>
                        <div className="text-2xl font-bold text-red-600 mt-0.5">{metrics?.openViolations || 0}</div>
                    </div>
                </div>

                {/* Exceptions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-xl flex-shrink-0">
                        <FaCheckCircle />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Approved Overrides</span>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{metrics?.activeExceptions || 0}</div>
                    </div>
                </div>

                {/* Cycle Time */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-xl flex-shrink-0">
                        <FaUserClock />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Avg Approval Cycle</span>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{metrics?.averageCycleTimeMinutes || 0} mins</div>
                    </div>
                </div>
            </div>

            {/* Compliance Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FaBook className="text-slate-400 text-sm" />
                        Compliance Audit Logs
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50/40">
                                <th className="py-4 px-6">Record Title</th>
                                <th className="py-4 px-6">Type</th>
                                <th className="py-4 px-6">Severity</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Timestamp</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                            {records.length > 0 ? (
                                records.map(record => (
                                    <tr key={record._id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-800">{record.title}</div>
                                            <div className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-sm">{record.description}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs uppercase font-semibold text-slate-500 font-mono">
                                                {record.recordType.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(record.severity)}`}>
                                                {record.severity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`text-xs font-semibold ${
                                                record.status === "open" ? "text-red-500" : (record.status === "resolved" ? "text-emerald-500" : "text-amber-500")
                                            }`}>
                                                {record.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-400">
                                            {new Date(record.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => openReviewModal(record)}
                                                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors"
                                            >
                                                Review Case
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                                        No compliance record logs generated.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {isOpen && reviewingRecord && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Review Compliance Case</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleReviewSubmit}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Alert Details</span>
                                    <h3 className="font-bold text-slate-800">{reviewingRecord.title}</h3>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">{reviewingRecord.description}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Action Status</label>
                                    <select
                                        value={reviewForm.status}
                                        onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="open">Open (Active Alert)</option>
                                        <option value="resolved">Resolved (Mitigated)</option>
                                        <option value="monitored">Monitored (Exceptions Allowed)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Review Analysis Notes</label>
                                    <textarea
                                        required
                                        value={reviewForm.reviewNotes}
                                        onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        rows="3"
                                        placeholder="Explain case resolution or context..."
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-sm transition-colors"
                                >
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Exception Override Modal */}
            {isOverrideOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Authorize Exception Override</h2>
                            <button onClick={() => setIsOverrideOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleOverrideSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Exception Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={overrideForm.title}
                                        onChange={(e) => setOverrideForm({ ...overrideForm, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Allow dev deployment during work hours override"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Justification & Context</label>
                                    <textarea
                                        required
                                        value={overrideForm.description}
                                        onChange={(e) => setOverrideForm({ ...overrideForm, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        rows="3"
                                        placeholder="Provide justification..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Policy</label>
                                        <select
                                            value={overrideForm.policyId}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, policyId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">-- Choose Policy --</option>
                                            {policies.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={overrideForm.durationDays}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, durationDays: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOverrideOpen(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-sm transition-colors"
                                >
                                    Authorize Override
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceDashboard;
