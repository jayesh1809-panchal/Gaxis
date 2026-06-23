import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getProvisioningRule, updateProvisioningRule } from "../../services/provisioningService";
import { getRoles } from "../../services/roleService";
import LoadingSpinner from "../LoadingSpinner";

const ProvisioningSettingsTab = ({ applicationId, isReadOnly }) => {
    const [formData, setFormData] = useState({
        autoCreateUser: false,
        syncProfile: true,
        syncRoles: true,
        defaultRole: "EMPLOYEE",
        status: "active",
    });
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [ruleResponse, rolesResponse] = await Promise.all([
                getProvisioningRule(applicationId),
                getRoles({ limit: 100 }), // fetch all roles
            ]);

            if (ruleResponse.data) {
                setFormData({
                    autoCreateUser: ruleResponse.data.autoCreateUser || false,
                    syncProfile: ruleResponse.data.syncProfile ?? true,
                    syncRoles: ruleResponse.data.syncRoles ?? true,
                    defaultRole: ruleResponse.data.defaultRole || "EMPLOYEE",
                    status: ruleResponse.data.status || "active",
                });
            }

            // Filter roles: System roles OR Application roles linked to this application
            const validRoles = (rolesResponse.data || []).filter(
                (r) => r.roleType === "SYSTEM" || r.applicationId === applicationId
            );
            setRoles(validRoles);
        } catch (error) {
            toast.error("Failed to load provisioning settings");
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCheckboxChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.checked });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;

        try {
            setSaving(true);
            await updateProvisioningRule(applicationId, formData);
            toast.success("Provisioning settings saved successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
                {/* Section 1: Auto Provisioning */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Auto Provisioning</h3>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="autoCreateUser"
                                name="autoCreateUser"
                                type="checkbox"
                                checked={formData.autoCreateUser}
                                onChange={handleCheckboxChange}
                                disabled={isReadOnly}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-50"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="autoCreateUser" className="font-medium text-slate-700">Enable Auto User Creation</label>
                            <p className="text-slate-500">Automatically create users inside connected applications when they successfully authenticate through G-Axis.</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Profile Sync */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Profile Synchronization</h3>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="syncProfile"
                                name="syncProfile"
                                type="checkbox"
                                checked={formData.syncProfile}
                                onChange={handleCheckboxChange}
                                disabled={isReadOnly}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-50"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="syncProfile" className="font-medium text-slate-700">Sync User Profile</label>
                            <p className="text-slate-500">Keep name, email, department, designation, and metadata synchronized across applications.</p>
                        </div>
                    </div>
                </div>

                {/* Section 3: Role Sync */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Role Synchronization</h3>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="syncRoles"
                                name="syncRoles"
                                type="checkbox"
                                checked={formData.syncRoles}
                                onChange={handleCheckboxChange}
                                disabled={isReadOnly}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-50"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="syncRoles" className="font-medium text-slate-700">Sync Roles</label>
                            <p className="text-slate-500">Synchronize approved G-Axis roles into the connected application.</p>
                        </div>
                    </div>
                </div>

                {/* Section 4: Default Role */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Default Role</h3>
                    <div className="max-w-xs">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Default Role on Provisioning</label>
                        <select
                            name="defaultRole"
                            value={formData.defaultRole}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border disabled:bg-slate-50 disabled:text-slate-500"
                        >
                            <option value="">-- None --</option>
                            {roles.map((role) => (
                                <option key={role._id} value={role.code}>
                                    {role.name} ({role.code})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">Only roles valid for this application or generic system roles appear here.</p>
                    </div>
                </div>

                {/* Section 5: Advanced Settings */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Advanced Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="requireApproval"
                                    type="checkbox"
                                    disabled
                                    className="focus:ring-blue-500 h-4 w-4 text-slate-300 border-slate-200 rounded opacity-50 cursor-not-allowed"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="requireApproval" className="font-medium text-slate-400">Require Approval Before Provisioning (Coming Soon)</label>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="status"
                                    name="status"
                                    type="checkbox"
                                    checked={formData.status === "inactive"}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "inactive" : "active" })}
                                    disabled={isReadOnly}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-50"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="status" className="font-medium text-slate-700">Disable Provisioning During Maintenance</label>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="auditTracking"
                                    type="checkbox"
                                    checked
                                    disabled
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-50"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="auditTracking" className="font-medium text-slate-700">Enable Provisioning Audit Tracking</label>
                                <p className="text-slate-500">System forced feature. All provisioning attempts are audited automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isReadOnly && (
                <div className="flex justify-end pt-8 border-t border-slate-200 mt-8">
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

export default ProvisioningSettingsTab;
