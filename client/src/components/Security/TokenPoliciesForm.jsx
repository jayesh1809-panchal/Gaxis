import React, { useState, useEffect } from "react";
import securityService from "../../services/securityService";
import { toast } from "react-hot-toast";

const TokenPoliciesForm = ({ applicationId }) => {
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
            toast.error("Failed to load policies");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPolicy(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                accessTokenTtl: policy.accessTokenTtl,
                refreshTokenTtl: policy.refreshTokenTtl,
                sessionIdleTimeout: policy.sessionIdleTimeout,
                absoluteSessionLifetime: policy.absoluteSessionLifetime
            };
            await securityService.updatePolicies(applicationId, dataToSave);
            toast.success("Token policies updated successfully");
        } catch (error) {
            toast.error("Failed to update token policies");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading policies...</div>;
    if (!policy) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Token & Session Policies</h2>
            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Access Token TTL (Seconds)</label>
                        <input
                            type="number"
                            name="accessTokenTtl"
                            value={policy.accessTokenTtl}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Default: 3600 (1 hour)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Refresh Token TTL (Seconds)</label>
                        <input
                            type="number"
                            name="refreshTokenTtl"
                            value={policy.refreshTokenTtl}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Default: 604800 (7 days)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Session Idle Timeout (Seconds)</label>
                        <input
                            type="number"
                            name="sessionIdleTimeout"
                            value={policy.sessionIdleTimeout}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Default: 86400 (1 day)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Absolute Session Lifetime (Seconds)</label>
                        <input
                            type="number"
                            name="absoluteSessionLifetime"
                            value={policy.absoluteSessionLifetime}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Default: 2592000 (30 days)</p>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Policies"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TokenPoliciesForm;
