import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getApplications } from "../services/applicationService";
import { getUserApplications, assignApplication, removeApplicationAccess, updateApplicationAccess } from "../services/userService";
import LoadingSpinner from "./LoadingSpinner";

const UserApplicationsModal = ({ isOpen, onClose, user }) => {
    const [allApplications, setAllApplications] = useState([]);
    const [userAccessList, setUserAccessList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState("");

    useEffect(() => {
        if (isOpen && user) {
            loadData();
        }
    }, [isOpen, user]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load all available applications (ignoring pagination for this modal logic, setting limit to 100)
            const appsResponse = await getApplications({ limit: 100 });
            setAllApplications(appsResponse.data);

            // Load user's assigned applications
            const accessResponse = await getUserApplications(user._id);
            setUserAccessList(accessResponse.data);
        } catch (error) {
            toast.error("Failed to load application data");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter out applications the user already has access to
    const availableAppsToAssign = allApplications.filter(
        app => !userAccessList.some(access => access.applicationId._id === app._id)
    );

    const handleAssign = async () => {
        if (!selectedAppId) {
            toast.error("Please select an application to assign");
            return;
        }

        try {
            await assignApplication(user._id, selectedAppId);
            toast.success("Application assigned successfully");
            setSelectedAppId("");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign application");
        }
    };

    const handleToggleStatus = async (accessRecord) => {
        const newStatus = accessRecord.status === "active" ? "revoked" : "active";
        try {
            await updateApplicationAccess(user._id, accessRecord.applicationId._id, newStatus);
            toast.success(`Access ${newStatus === 'active' ? 'restored' : 'revoked'}`);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update access");
        }
    };

    const handleRemove = async (appId) => {
        try {
            await removeApplicationAccess(user._id, appId);
            toast.success("Access permanently removed");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove access");
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        Manage Application Access: {user.firstName} {user.lastName}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                        &times;
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Assign New Application Section */}
                    <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">Assign New Application</h4>
                        <div className="flex gap-3">
                            <select
                                value={selectedAppId}
                                onChange={(e) => setSelectedAppId(e.target.value)}
                                className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border bg-white"
                            >
                                <option value="">-- Select Application --</option>
                                {availableAppsToAssign.map(app => (
                                    <option key={app._id} value={app._id}>
                                        {app.name} ({app.code})
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedAppId || loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                            >
                                Grant Access
                            </button>
                        </div>
                    </div>

                    {/* Assigned Applications List */}
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Current Access</h4>
                    
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Application</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {userAccessList.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-6 text-center text-slate-500 text-sm">
                                                No applications assigned to this user.
                                            </td>
                                        </tr>
                                    ) : (
                                        userAccessList.map(access => (
                                            <tr key={access._id}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-medium text-slate-900">{access.applicationId.name}</div>
                                                    <div className="text-xs text-slate-500">{access.applicationId.code}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${access.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {access.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleToggleStatus(access)}
                                                            title={access.status === 'active' ? "Revoke Access" : "Restore Access"}
                                                            className={`${access.status === 'active' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                                        >
                                                            {access.status === 'active' ? <FaTimesCircle size={18} /> : <FaCheckCircle size={18} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemove(access.applicationId._id)}
                                                            title="Permanently Remove Mapping"
                                                            className="text-red-600 hover:text-red-900 ml-2"
                                                        >
                                                            <FaTrash size={16} />
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
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-900"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserApplicationsModal;
