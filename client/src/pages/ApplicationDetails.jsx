import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaCogs, FaUsersCog, FaHistory, FaShieldAlt } from "react-icons/fa";
import { getApplication } from "../services/applicationService";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import GeneralSettingsTab from "../components/Application/GeneralSettingsTab";
import ProvisioningSettingsTab from "../components/Provisioning/ProvisioningSettingsTab";
import ProvisioningHistoryTab from "../components/Provisioning/ProvisioningHistoryTab";
import SecuritySettingsTab from "../components/Security/SecuritySettingsTab";

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser: user, hasRole } = useAuth();
    
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                setLoading(true);
                const response = await getApplication(id);
                setApplication(response.data);
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to load application details");
                navigate("/applications");
            } finally {
                setLoading(false);
            }
        };
        fetchApplication();
    }, [id, navigate]);

    if (loading) return <LoadingSpinner />;
    if (!application) return null;

    const isOwnerOrAdmin = hasRole("SYSTEM_ADMIN") || hasRole("SUPER_ADMIN") || user.id === application.ownerId;

    const tabs = [
        { id: "general", label: "General Settings", icon: <FaCogs /> },
        { id: "security", label: "Security & Credentials", icon: <FaShieldAlt /> },
        { id: "provisioning", label: "Provisioning Settings", icon: <FaUsersCog /> },
        { id: "history", label: "Provisioning History", icon: <FaHistory /> },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate("/applications")}
                    className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
                >
                    <FaArrowLeft className="mr-2" /> Back to Applications
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{application.name}</h1>
                        <p className="text-slate-500 font-mono mt-1">Client ID: {application.clientId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={application.status} />
                    </div>
                </div>
            </div>

            {!isOwnerOrAdmin && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6 text-sm">
                    <strong>Read-Only Mode:</strong> You do not have permission to modify this application.
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                                ${
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === "general" && (
                    <GeneralSettingsTab 
                        application={application} 
                        isReadOnly={!isOwnerOrAdmin}
                        onUpdate={(updatedApp) => setApplication(updatedApp)}
                    />
                )}
                {activeTab === "provisioning" && (
                    <ProvisioningSettingsTab 
                        applicationId={application._id} 
                        isReadOnly={!isOwnerOrAdmin} 
                    />
                )}
                {activeTab === "history" && (
                    <ProvisioningHistoryTab 
                        applicationId={application._id} 
                    />
                )}
                {activeTab === "security" && (
                    <SecuritySettingsTab 
                        applicationId={application._id} 
                    />
                )}
            </div>
        </div>
    );
};

export default ApplicationDetails;
