import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaUserCog, FaPlus, FaTrash, FaUser, FaBuilding, FaThLarge, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios";
import {
    getDelegatedAdmins,
    assignDelegatedAdmin,
    revokeDelegatedAdmin,
    getOrganizationUnits
} from "../services/governanceService";
import LoadingSpinner from "../components/LoadingSpinner";

const DelegatedAdminCenter = () => {
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        userId: "",
        adminRole: "DEPARTMENT_ADMIN",
        scopeType: "ORGANIZATION_UNIT",
        scopeId: ""
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [adminRes, userRes, unitRes, appRes] = await Promise.all([
                getDelegatedAdmins(),
                api.get("/users"),
                getOrganizationUnits(),
                api.get("/applications")
            ]);
            
            setAdmins(adminRes.data.data);
            setUsers(userRes.data.data || []);
            setUnits(unitRes.data.data);
            setApplications(appRes.data.data || []);
        } catch (error) {
            console.error("Failed to load delegated admin assignments", error);
            toast.error("Failed to load delegation dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openModal = () => {
        setFormData({
            userId: users[0]?._id || "",
            adminRole: "DEPARTMENT_ADMIN",
            scopeType: "ORGANIZATION_UNIT",
            scopeId: ""
        });
        setIsOpen(true);
    };

    const handleScopeTypeChange = (e) => {
        const type = e.target.value;
        setFormData(prev => ({
            ...prev,
            scopeType: type,
            scopeId: type === "ALL" ? "" : (type === "ORGANIZATION_UNIT" ? (units[0]?._id || "") : (applications[0]?._id || ""))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                userId: formData.userId,
                adminRole: formData.adminRole,
                scopeType: formData.scopeType,
                scopeId: formData.scopeType === "ALL" ? null : formData.scopeId
            };
            await assignDelegatedAdmin(payload);
            toast.success("Administrative privileges delegated successfully!");
            setIsOpen(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Delegation failed");
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm("Are you sure you want to revoke this delegation assignment?")) return;
        try {
            await revokeDelegatedAdmin(id);
            toast.success("Delegation revoked successfully");
            loadData();
        } catch (err) {
            toast.error("Failed to revoke privileges");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaUserCog className="text-blue-600 text-2xl" />
                        Delegated Administration
                    </h1>
                    <p className="text-slate-500 mt-1">Assign, audit, and audit scoped administrative rights across divisions or individual apps.</p>
                </div>
                <button
                    onClick={openModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                    <FaPlus className="text-xs" />
                    Delegate Admin Rights
                </button>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.length > 0 ? (
                    admins.map(admin => (
                        <div key={admin._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <FaUser />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">
                                                {admin.userId?.firstName} {admin.userId?.lastName}
                                            </h3>
                                            <p className="text-slate-500 text-[10px] truncate max-w-[160px]">{admin.userId?.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                                        {admin.adminRole.replace("_", " ")}
                                    </span>
                                </div>

                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        {admin.scopeType === "ALL" && <FaShieldAlt className="text-slate-400 text-sm" />}
                                        {admin.scopeType === "ORGANIZATION_UNIT" && <FaBuilding className="text-slate-400 text-sm" />}
                                        {admin.scopeType === "APPLICATION" && <FaThLarge className="text-slate-400 text-sm" />}
                                        <div>
                                            <span className="font-semibold text-slate-500 block">Scope:</span>
                                            <span className="font-medium text-slate-800">
                                                {admin.scopeType === "ALL" 
                                                    ? "Global Scope" 
                                                    : (admin.scopeType === "ORGANIZATION_UNIT" 
                                                        ? `Org Unit: ${admin.scopeId?.name || "Deleted Unit"}` 
                                                        : `App: ${admin.scopeId?.name || "Deleted App"}`)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 mt-5 pt-4 flex justify-end">
                                <button
                                    onClick={() => handleRevoke(admin._id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-1.5 px-3 rounded-lg text-xs border border-red-200 transition-colors flex items-center gap-1.5"
                                >
                                    <FaTrash className="text-[10px]" />
                                    Revoke Assignment
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white p-12 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl">
                        No delegated administrative assignments configured.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Delegate Administrative Access</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select User</label>
                                    <select
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">-- Choose User --</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Delegated Admin Role</label>
                                        <select
                                            value={formData.adminRole}
                                            onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="GLOBAL_ADMIN">Global Admin</option>
                                            <option value="TENANT_ADMIN">Tenant Admin</option>
                                            <option value="BUSINESS_UNIT_ADMIN">Business Unit Admin</option>
                                            <option value="DEPARTMENT_ADMIN">Department Admin</option>
                                            <option value="APPLICATION_ADMIN">Application Admin</option>
                                            <option value="SECURITY_ADMIN">Security Admin</option>
                                            <option value="AUDIT_ADMIN">Audit Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Access Scope Type</label>
                                        <select
                                            value={formData.scopeType}
                                            onChange={handleScopeTypeChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="ALL">All (Global Scope)</option>
                                            <option value="ORGANIZATION_UNIT">Organization Unit Scoped</option>
                                            <option value="APPLICATION">Application Scoped</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.scopeType !== "ALL" && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                            Select Target {formData.scopeType === "ORGANIZATION_UNIT" ? "Organization Unit" : "Application"}
                                        </label>
                                        <select
                                            value={formData.scopeId}
                                            onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            required
                                        >
                                            <option value="">-- Choose Target --</option>
                                            {formData.scopeType === "ORGANIZATION_UNIT" 
                                                ? units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.type})</option>)
                                                : applications.map(app => <option key={app._id} value={app._id}>{app.name} ({app.code})</option>)
                                            }
                                        </select>
                                    </div>
                                )}
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
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DelegatedAdminCenter;
