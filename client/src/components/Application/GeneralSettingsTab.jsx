import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { updateApplication } from "../../services/applicationService";

const GeneralSettingsTab = ({ application, isReadOnly, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: "",
        frontendUrl: "",
        backendUrl: "",
        version: "",
        status: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (application) {
            setFormData({
                name: application.name || "",
                frontendUrl: application.frontendUrl || "",
                backendUrl: application.backendUrl || "",
                version: application.version || "1.0.0",
                status: application.status || "active",
            });
        }
    }, [application]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        try {
            setSaving(true);
            const response = await updateApplication(application._id, formData);
            toast.success("Application settings updated successfully");
            if (onUpdate) onUpdate(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Application Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        required
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Application Code</label>
                    <input
                        type="text"
                        value={application.code}
                        disabled
                        className="w-full rounded-md border-slate-200 shadow-sm py-2 px-3 border bg-slate-100 text-slate-500 font-mono"
                    />
                </div>
                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">Endpoints</h3>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frontend URL *</label>
                    <input
                        type="url"
                        name="frontendUrl"
                        value={formData.frontendUrl}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        required
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Backend URL *</label>
                    <input
                        type="url"
                        name="backendUrl"
                        value={formData.backendUrl}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        required
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>
                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">Lifecycle</h3>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Version *</label>
                    <input
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        required
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>
            
            {!isReadOnly && (
                <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            )}
        </form>
    );
};

export default GeneralSettingsTab;
