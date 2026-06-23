import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { getApplications, createApplication, updateApplication, deleteApplication } from "../services/applicationService";
import ApplicationModal from "../components/ApplicationModal";
import ConfirmModal from "../components/ConfirmModal";
import SecretModal from "../components/SecretModal";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import InstalledAppsTab from "../components/Marketplace/InstalledAppsTab";

const Applications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modal States
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [appToDelete, setAppToDelete] = useState(null);
    
    const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
    const [newSecret, setNewSecret] = useState("");

    // Tabs
    const [activeTab, setActiveTab] = useState("custom"); // custom or marketplace

    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getApplications({ page, limit, search });
            setApplications(response.data);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        // Debounce search slightly to avoid excessive API calls
        const timer = setTimeout(() => {
            loadApplications();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadApplications]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1 on new search
    };

    const handleAddClick = () => {
        setSelectedApp(null);
        setIsAppModalOpen(true);
    };

    const handleEditClick = (app) => {
        navigate(`/applications/${app._id}`);
    };

    const handleDeleteClick = (app) => {
        setAppToDelete(app);
        setIsConfirmOpen(true);
    };

    const handleToggleStatus = async (app) => {
        const newStatus = app.status === "active" ? "inactive" : "active";
        try {
            await updateApplication(app._id, { status: newStatus });
            toast.success(`Application marked as ${newStatus}`);
            loadApplications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleSaveApplication = async (formData) => {
        try {
            if (selectedApp) {
                await updateApplication(selectedApp._id, formData);
                toast.success("Application updated successfully");
            } else {
                const response = await createApplication(formData);
                toast.success("Application created successfully");
                if (response.data.plainClientSecret) {
                    setNewSecret(response.data.plainClientSecret);
                    setIsSecretModalOpen(true);
                }
            }
            setIsAppModalOpen(false);
            loadApplications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const confirmDelete = async () => {
        if (!appToDelete) return;
        try {
            await deleteApplication(appToDelete._id);
            toast.success("Application deleted successfully");
            setIsConfirmOpen(false);
            loadApplications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete application");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Applications Registry</h1>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    <FaPlus /> Register Application
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("custom")}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === "custom" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
                        `}
                    >
                        Custom Applications
                    </button>
                    <button
                        onClick={() => setActiveTab("marketplace")}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === "marketplace" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
                        `}
                    >
                        Marketplace Installations
                    </button>
                </nav>
            </div>

            {activeTab === "custom" && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="relative w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Version</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-900">{app.name}</div>
                                                <div className="text-sm text-slate-500">{app.code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {app.version}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                                {app.clientId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleToggleStatus(app)}
                                                        title={app.status === 'active' ? "Disable" : "Enable"}
                                                        className={`text-lg ${app.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {app.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditClick(app)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(app)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {activeTab === "marketplace" && (
                <InstalledAppsTab />
            )}

            {/* Modals */}
            <ApplicationModal 
                isOpen={isAppModalOpen} 
                onClose={() => setIsAppModalOpen(false)} 
                onSave={handleSaveApplication} 
                application={selectedApp} 
            />

            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Application" 
                message={`Are you sure you want to delete ${appToDelete?.name}? This action cannot be undone.`} 
            />

            <SecretModal 
                isOpen={isSecretModalOpen} 
                onClose={() => setIsSecretModalOpen(false)} 
                secret={newSecret} 
            />

        </div>
    );
};

export default Applications;