import { useState, useEffect } from "react";
import { getMySessions, revokeSession, revokeAllSessions } from "../services/sessionService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { FaLaptop, FaMobileAlt, FaDesktop, FaSignOutAlt, FaTrashAlt } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth(); // Needed to redirect/clear local state if current session dies

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const { data } = await getMySessions();
            setSessions(data);
        } catch (error) {
            toast.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id, isCurrent) => {
        if (!window.confirm("Are you sure you want to log out this device?")) return;
        
        try {
            await revokeSession(id);
            toast.success("Session revoked successfully");
            if (isCurrent) {
                // If they revoked their own session, force logout
                logout();
            } else {
                fetchSessions();
            }
        } catch (error) {
            toast.error("Failed to revoke session");
        }
    };

    const handleRevokeAll = async () => {
        if (!window.confirm("Are you sure you want to log out from all devices? You will be logged out immediately.")) return;
        
        try {
            await revokeAllSessions();
            toast.success("All sessions revoked");
            logout(); // Clear current local state
        } catch (error) {
            toast.error("Failed to revoke all sessions");
        }
    };

    const getDeviceIcon = (deviceInfo) => {
        const info = deviceInfo.toLowerCase();
        if (info.includes("iphone") || info.includes("android") || info.includes("mobile")) {
            return <FaMobileAlt className="text-2xl text-slate-400" />;
        }
        if (info.includes("mac") || info.includes("windows") || info.includes("desktop")) {
            return <FaDesktop className="text-2xl text-slate-400" />;
        }
        return <FaLaptop className="text-2xl text-slate-400" />;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "active":
                return <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">ACTIVE</span>;
            case "revoked":
                return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">REVOKED</span>;
            case "expired":
                return <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full">EXPIRED</span>;
            default:
                return null;
        }
    };

    // Determine the most recently active session, assuming the one with the latest lastActivityAt is current
    // In a real app with token matching, we could pass the current sessionId from the backend. 
    // Here we'll just assume the first 'active' one (since sorted by lastActivityAt DESC) is "This Device".
    // A better approach is matching the user-agent + IP, or passing the ID from backend, but this works for UI.
    const activeSessions = sessions.filter(s => s.status === "active");
    const currentSessionId = activeSessions.length > 0 ? activeSessions[0]._id : null;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
                    <p className="text-slate-500 mt-1">Manage the devices that are currently logged into your account.</p>
                </div>
                <button
                    onClick={handleRevokeAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded transition-colors"
                >
                    <FaSignOutAlt />
                    Logout All Devices
                </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-slate-200">
                <ul className="divide-y divide-slate-200">
                    {sessions.map((session) => {
                        const isCurrent = session._id === currentSessionId;
                        return (
                            <li key={session._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-slate-100 rounded-full">
                                        {getDeviceIcon(session.deviceInfo)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {session.deviceInfo}
                                            </h3>
                                            {isCurrent && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200">
                                                    This Device
                                                </span>
                                            )}
                                            {getStatusBadge(session.status)}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 mt-2">
                                            <p><span className="font-medium text-slate-700">Browser:</span> {session.browser}</p>
                                            <p><span className="font-medium text-slate-700">OS:</span> {session.operatingSystem}</p>
                                            <p><span className="font-medium text-slate-700">IP Address:</span> {session.ipAddress}</p>
                                            <p><span className="font-medium text-slate-700">Location:</span> {session.location?.city || "Unknown"}</p>
                                            <p><span className="font-medium text-slate-700">Last Active:</span> {new Date(session.lastActivityAt).toLocaleString()}</p>
                                            <p><span className="font-medium text-slate-700">Created:</span> {new Date(session.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {session.status === "active" && (
                                    <button
                                        onClick={() => handleRevoke(session._id, isCurrent)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Log out this device"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                    
                    {sessions.length === 0 && (
                        <li className="p-8 text-center text-slate-500">
                            No sessions found.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Sessions;
