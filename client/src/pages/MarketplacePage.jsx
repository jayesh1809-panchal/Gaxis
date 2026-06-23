import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getMarketplaceApplications } from "../services/marketplaceService";
import LoadingSpinner from "../components/LoadingSpinner";

const MarketplacePage = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const res = await getMarketplaceApplications();
            setApplications(res.data.data);
        } catch (error) {
            toast.error("Failed to load marketplace applications");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Application Marketplace</h1>
                <p className="text-slate-500 mt-2">
                    Browse and install pre-configured applications for your tenant ecosystem.
                </p>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-lg">No applications available in the marketplace yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.map((app) => (
                        <div key={app._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    {app.icon ? (
                                        <img src={app.icon} alt={app.name} className="h-12 w-12 rounded-md object-cover mr-4 bg-gray-100" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mr-4">
                                            {app.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {app.category}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-3 h-16">
                                    {app.description}
                                </p>
                                <div className="flex items-center justify-between mt-4 border-t pt-4">
                                    <span className="text-xs text-gray-400">v{app.version}</span>
                                    <button
                                        onClick={() => navigate(`/marketplace/${app._id}`)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarketplacePage;
