import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { getMarketplaceApplicationDetails, installApplication } from "../services/marketplaceService";
import LoadingSpinner from "../components/LoadingSpinner";

const MarketplaceApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [appData, setAppData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    
    // For custom URLs
    const [customUrls, setCustomUrls] = useState("");

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            const res = await getMarketplaceApplicationDetails(id);
            setAppData(res.data.data);
        } catch (error) {
            toast.error("Failed to load application details");
            navigate("/marketplace");
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async () => {
        setInstalling(true);
        try {
            let redirectUrisArray = [];
            if (customUrls.trim() !== "") {
                redirectUrisArray = customUrls.split(",").map(u => u.trim()).filter(u => u !== "");
            }

            const res = await installApplication(id, { customRedirectUris: redirectUrisArray });
            toast.success("Application installed successfully!");
            
            // Navigate to the newly created Application's detail page
            navigate(`/applications/${res.data.data.applicationId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Installation failed");
        } finally {
            setInstalling(false);
            setShowInstallModal(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!appData) return null;

    const { application: app, package: pkg } = appData;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <button
                onClick={() => navigate("/marketplace")}
                className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
            >
                <FaArrowLeft className="mr-2" /> Back to Marketplace
            </button>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        {app.icon ? (
                            <img src={app.icon} alt={app.name} className="h-20 w-20 rounded-lg object-cover mr-6 border" />
                        ) : (
                            <div className="h-20 w-20 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl mr-6">
                                {app.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                                <span>Version {app.version}</span>
                                <span>•</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {app.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowInstallModal(true)}
                            className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Install Application
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-4">Overview</h2>
                    <p className="text-gray-700 mb-8 whitespace-pre-wrap">{app.description}</p>

                    {pkg && (
                        <div className="bg-slate-50 p-6 rounded-lg border">
                            <h3 className="text-lg font-bold mb-4">Installation Footprint</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Installing this application will automatically provision the following resources in your tenant:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Roles ({pkg.defaultRoles?.length || 0})</h4>
                                    <ul className="space-y-2">
                                        {pkg.defaultRoles?.map((role, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                                <span><strong>{role.name}</strong> - {role.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Permissions ({pkg.defaultPermissions?.length || 0})</h4>
                                    <ul className="space-y-2">
                                        {pkg.defaultPermissions?.map((perm, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                                <span><strong>{perm.name}</strong></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Install Modal */}
            {showInstallModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Install {app.name}</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            This will create a new OAuth Application in your tenant and provision all required roles and permissions.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-6 text-left">
                                    <label className="block text-sm font-medium text-gray-700">Custom Redirect URIs (Optional)</label>
                                    <p className="text-xs text-gray-500 mb-2">If you are hosting this application on your own domain, provide the callback URLs here (comma-separated).</p>
                                    <input
                                        type="text"
                                        placeholder="https://app.yourcompany.com/callback"
                                        value={customUrls}
                                        onChange={(e) => setCustomUrls(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleInstall}
                                    disabled={installing}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {installing ? "Installing..." : "Confirm Installation"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInstallModal(false)}
                                    disabled={installing}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketplaceApplicationDetails;
