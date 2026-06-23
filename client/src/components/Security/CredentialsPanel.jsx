import React, { useState, useEffect } from "react";
import securityService from "../../services/securityService";
import { toast } from "react-hot-toast";

const CredentialsPanel = ({ applicationId }) => {
    const [credentials, setCredentials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newSecret, setNewSecret] = useState("");
    const [rotating, setRotating] = useState(false);
    const [gracePeriod, setGracePeriod] = useState(24);

    useEffect(() => {
        loadCredentials();
    }, [applicationId]);

    const loadCredentials = async () => {
        try {
            const res = await securityService.getCredentials(applicationId);
            setCredentials(res.data);
        } catch (error) {
            toast.error("Failed to load credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleRotate = async () => {
        if (!window.confirm("Are you sure you want to rotate the client secret? The old secret will remain active for the selected grace period.")) {
            return;
        }

        setRotating(true);
        try {
            const res = await securityService.rotateSecret(applicationId, { gracePeriodHours: gracePeriod });
            setNewSecret(res.data.clientSecret);
            toast.success("Client secret rotated successfully");
            loadCredentials();
        } catch (error) {
            toast.error("Failed to rotate secret");
        } finally {
            setRotating(false);
        }
    };

    if (loading) return <div>Loading credentials...</div>;
    if (!credentials) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">API Credentials</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Client ID</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                        type="text"
                        readOnly
                        value={credentials.clientId}
                        className="flex-1 block w-full px-3 py-2 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 focus:ring-0 focus:border-gray-300"
                    />
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(credentials.clientId);
                            toast.success("Copied Client ID!");
                        }}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    >
                        Copy
                    </button>
                </div>
            </div>

            {credentials.clientType === "confidential" && (
                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-medium">Secret Rotation</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Generate a new client secret. The current active secret will be moved to a legacy status for the duration of the grace period.
                    </p>

                    {newSecret && (
                        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                            <p className="text-sm text-yellow-700 font-bold mb-2">
                                ⚠️ New Secret Generated! Please copy this now. It will not be shown again.
                            </p>
                            <div className="flex">
                                <input
                                    type="text"
                                    readOnly
                                    value={newSecret}
                                    className="flex-1 block w-full px-3 py-2 sm:text-sm border-yellow-300 rounded-l-md bg-white"
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(newSecret);
                                        toast.success("Copied New Secret!");
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-l-0 border-yellow-300 rounded-r-md bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium"
                                >
                                    Copy Secret
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grace Period (Hours)</label>
                            <select
                                value={gracePeriod}
                                onChange={(e) => setGracePeriod(Number(e.target.value))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value={0}>0 (Immediate)</option>
                                <option value={24}>24 Hours</option>
                                <option value={48}>48 Hours</option>
                                <option value={168}>7 Days</option>
                            </select>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={handleRotate}
                                disabled={rotating}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {rotating ? "Rotating..." : "Rotate Secret"}
                            </button>
                        </div>
                    </div>

                    {credentials.secrets && credentials.secrets.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Secret History</h4>
                            <table className="min-w-full divide-y divide-gray-200 border rounded">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expires (Grace)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {credentials.secrets.map((s) => (
                                        <tr key={s._id}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{new Date(s.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    s.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    s.status === 'legacy' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                {s.expiresAt ? new Date(s.expiresAt).toLocaleString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CredentialsPanel;
