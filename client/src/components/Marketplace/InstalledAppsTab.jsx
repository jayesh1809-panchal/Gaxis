import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaTrash, FaExternalLinkAlt, FaCreditCard } from "react-icons/fa";
import { getInstalledApplications, uninstallApplication } from "../../services/marketplaceService";
import LoadingSpinner from "../LoadingSpinner";

const InstalledAppsTab = () => {
    const navigate = useNavigate();
    const [installations, setInstallations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInstallations();
    }, []);

    const loadInstallations = async () => {
        try {
            const res = await getInstalledApplications();
            setInstallations(res.data.data);
        } catch (error) {
            toast.error("Failed to load installed applications");
        } finally {
            setLoading(false);
        }
    };

    const handleUninstall = async (marketplaceAppId) => {
        if (!window.confirm("Are you sure you want to uninstall this application? This will immediately revoke all user sessions for this app.")) {
            return;
        }

        try {
            await uninstallApplication(marketplaceAppId);
            toast.success("Application uninstalled successfully");
            loadInstallations();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to uninstall application");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-medium text-slate-800">Marketplace Installations</h2>
                <button
                    onClick={() => navigate("/marketplace")}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Browse Marketplace
                </button>
            </div>
            
            {installations.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No marketplace applications installed.</p>
                    <button
                        onClick={() => navigate("/marketplace")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Explore Marketplace
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Application</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Installed On</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {installations.map((inst) => (
                                <tr key={inst._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {inst.marketplaceAppId?.icon ? (
                                                <img src={inst.marketplaceAppId.icon} alt="" className="h-8 w-8 rounded-md mr-3" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                                    {inst.marketplaceAppId?.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-slate-900">{inst.marketplaceAppId?.name}</div>
                                                <div className="text-xs text-slate-500">v{inst.marketplaceAppId?.version}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(inst.installedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inst.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {inst.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-4">
                                            <button
                                                onClick={() => navigate(`/applications/${inst.localApplicationId?._id}`)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                title="View Settings"
                                            >
                                                <FaExternalLinkAlt /> Settings
                                            </button>
                                            <button
                                                onClick={() => navigate(`/applications/${inst.marketplaceAppId?._id}/subscription`)}
                                                className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                                                title="Manage Subscription"
                                            >
                                                <FaCreditCard /> Subscription
                                            </button>
                                            <button
                                                onClick={() => handleUninstall(inst.marketplaceAppId._id)}
                                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                title="Uninstall"
                                            >
                                                <FaTrash /> Uninstall
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InstalledAppsTab;
