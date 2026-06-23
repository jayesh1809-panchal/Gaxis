import React, { useState, useEffect } from "react";
import securityService from "../../services/securityService";
import { toast } from "react-hot-toast";

const AccessControlPanel = ({ applicationId }) => {
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPolicies();
    }, [applicationId]);

    const loadPolicies = async () => {
        try {
            const res = await securityService.getPolicies(applicationId);
            setPolicy(res.data);
        } catch (error) {
            toast.error("Failed to load access control policies");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (field, currentValue) => {
        const newValue = !currentValue;
        
        let preserveSessions = false;
        if (field === "emergencyLockdown" && newValue === true) {
            if (!window.confirm("WARNING: Emergency Lockdown will block all new logins. Do you also want to immediately terminate all active sessions? Click OK to terminate all sessions, or Cancel to block new logins but keep existing sessions alive.")) {
                preserveSessions = true;
            } else {
                preserveSessions = false;
            }
        }

        setSaving(true);
        try {
            const dataToSave = {
                [field]: newValue
            };
            if (field === "emergencyLockdown") {
                dataToSave.preserveExistingSessionsOnLockdown = preserveSessions;
            }

            const res = await securityService.updatePolicies(applicationId, dataToSave);
            setPolicy(res.data);
            toast.success(`Access control updated successfully`);
        } catch (error) {
            toast.error("Failed to update access control");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading access controls...</div>;
    if (!policy) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">Danger Zone (Access Control)</h2>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
                        <p className="text-sm text-gray-500">
                            Temporarily disable access to this application for routine maintenance. Existing sessions will not be dropped, but new logins will be rejected.
                        </p>
                    </div>
                    <div>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleToggle("maintenanceMode", policy.maintenanceMode)}
                            className={`${
                                policy.maintenanceMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-200 hover:bg-gray-300'
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2`}
                            role="switch"
                            aria-checked={policy.maintenanceMode}
                        >
                            <span
                                aria-hidden="true"
                                className={`${
                                    policy.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-red-600">Emergency Lockdown</h3>
                        <p className="text-sm text-gray-500">
                            Instantly freeze the application. Blocks all requests. You will be prompted to revoke all active sessions. Use only in case of a security breach.
                        </p>
                    </div>
                    <div>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleToggle("emergencyLockdown", policy.emergencyLockdown)}
                            className={`${
                                policy.emergencyLockdown ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 hover:bg-gray-300'
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2`}
                            role="switch"
                            aria-checked={policy.emergencyLockdown}
                        >
                            <span
                                aria-hidden="true"
                                className={`${
                                    policy.emergencyLockdown ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessControlPanel;
