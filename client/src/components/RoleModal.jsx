import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getApplications } from "../services/applicationService";

const RoleModal = ({ isOpen, onClose, onSave, role }) => {
    const isEditing = !!role;

    const [applications, setApplications] = useState([]);
    
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        roleType: "APPLICATION",
        applicationId: "",
        status: "active",
    });

    // Fetch applications for the dropdown if RoleType is APPLICATION
    useEffect(() => {
        if (isOpen) {
            getApplications({ limit: 100 })
                .then((res) => setApplications(res.data))
                .catch((err) => toast.error("Failed to load applications for dropdown"));
        }
    }, [isOpen]);

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name || "",
                code: role.code || "",
                description: role.description || "",
                roleType: role.roleType || "APPLICATION",
                applicationId: role.applicationId ? role.applicationId._id : "",
                status: role.status || "active",
            });
        } else {
            setFormData({
                name: "",
                code: "",
                description: "",
                roleType: "APPLICATION",
                applicationId: "",
                status: "active",
            });
        }
    }, [role, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.code) {
            toast.error("Please fill in required fields (Name, Code).");
            return;
        }

        if (formData.roleType === "APPLICATION" && !formData.applicationId) {
            toast.error("Application is required for Application Roles.");
            return;
        }

        // Clean data before saving
        const payload = { ...formData };
        if (payload.roleType === "SYSTEM") {
            payload.applicationId = null;
        }

        onSave(payload);
    };

    // System roles protection checks
    const isSystemRole = isEditing && role.isSystemRole;

    return (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        {isEditing ? "Edit Role" : "Create Custom Role"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                        &times;
                    </button>
                </div>
                
                {isSystemRole && (
                    <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                            <span>🔒</span> System Roles are protected. Name and Code cannot be modified.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isSystemRole}
                                className={`w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border ${isSystemRole ? 'bg-slate-100 border-transparent text-slate-500' : 'border-slate-300'}`}
                                placeholder="HR Administrator"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={isSystemRole}
                                className={`w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border ${isSystemRole ? 'bg-slate-100 border-transparent text-slate-500' : 'border-slate-300'}`}
                                placeholder="HR_ADMIN"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="Brief description of the role responsibilities"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Type *</label>
                            <select
                                name="roleType"
                                value={formData.roleType}
                                onChange={handleChange}
                                disabled={isEditing} // Cannot change type after creation
                                className={`w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border ${isEditing ? 'bg-slate-100 border-transparent text-slate-500' : 'border-slate-300 bg-white'}`}
                            >
                                <option value="SYSTEM">Global System Role</option>
                                <option value="APPLICATION">Application Specific Role</option>
                            </select>
                        </div>

                        {formData.roleType === "APPLICATION" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Application *</label>
                                <select
                                    name="applicationId"
                                    value={formData.applicationId}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border bg-white"
                                >
                                    <option value="">-- Select Application --</option>
                                    {applications.map(app => (
                                        <option key={app._id} value={app._id}>
                                            {app.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.roleType === "SYSTEM" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        )}
                        
                        {formData.roleType === "APPLICATION" && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        >
                            {isEditing ? "Save Changes" : "Create Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleModal;
