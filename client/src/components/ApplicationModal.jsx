import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const ApplicationModal = ({ isOpen, onClose, onSave, application }) => {
    const isEditing = !!application;
    
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        version: "1.0.0",
        frontendUrl: "",
        backendUrl: "",
        status: "active",
    });

    useEffect(() => {
        if (application) {
            setFormData({
                name: application.name || "",
                code: application.code || "",
                version: application.version || "1.0.0",
                frontendUrl: application.frontendUrl || "",
                backendUrl: application.backendUrl || "",
                status: application.status || "active",
            });
        } else {
            setFormData({
                name: "",
                code: "",
                version: "1.0.0",
                frontendUrl: "",
                backendUrl: "",
                status: "active",
            });
        }
    }, [application, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Frontend Validation
        if (!formData.name || !formData.code || !formData.frontendUrl || !formData.backendUrl || !formData.version) {
            toast.error("Please fill in all required fields.");
            return;
        }

        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        {isEditing ? "Edit Application" : "Register Application"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                        &times;
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="HR Management"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={isEditing}
                                className={`w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border ${isEditing ? 'bg-slate-100 border-transparent text-slate-500' : 'border-slate-300'}`}
                                placeholder="HRMS"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frontend URL *</label>
                            <input
                                type="url"
                                name="frontendUrl"
                                value={formData.frontendUrl}
                                onChange={handleChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="https://app.g-axis.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Backend URL *</label>
                            <input
                                type="url"
                                name="backendUrl"
                                value={formData.backendUrl}
                                onChange={handleChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="https://api.g-axis.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Version *</label>
                            <input
                                type="text"
                                name="version"
                                value={formData.version}
                                onChange={handleChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="1.0.0"
                            />
                        </div>
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
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
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
                            {isEditing ? "Save Changes" : "Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationModal;
