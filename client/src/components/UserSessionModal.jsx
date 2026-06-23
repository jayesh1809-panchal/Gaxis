import { useState, useEffect } from "react";
import { getUserSessions, revokeUserSessions, forceRevokeSession } from "../services/sessionService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { FaLaptop, FaMobileAlt, FaDesktop, FaTrashAlt, FaTimes, FaSignOutAlt } from "react-icons/fa";

const UserSessionModal = ({ user, onClose }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const { data } = await getUserSessions(user._id);
            setSessions(data);
        } catch (error) {
            toast.error("Failed to load user sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleForceRevoke = async (id) => {
        if (!window.confirm("Are you sure you want to force log out this session?")) return;
        
        try {
            await forceRevokeSession(id);
            toast.success("Session force revoked");
            fetchSessions();
        } catch (error) {
            toast.error("Failed to revoke session");
        }
    };

    const handleForceRevokeAll = async () => {
        if (!window.confirm(`Are you sure you want to log out ${user.firstName} from all devices?`)) return;
        
        try {
            await revokeUserSessions(user._id);
            toast.success("All user sessions revoked");
            fetchSessions();
        } catch (error) {
            toast.error("Failed to revoke all sessions");
        }
    };

    const getDeviceIcon = (deviceInfo) => {
        const info = deviceInfo?.toLowerCase() || "";
        if (info.includes("iphone") || info.includes("android") || info.includes("mobile")) return <FaMobileAlt className="text-xl text-slate-400" />;
        if (info.includes("mac") || info.includes("windows") || info.includes("desktop")) return <FaDesktop className="text-xl text-slate-400" />;
        return <FaLaptop className="text-xl text-slate-400" />;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "active": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">ACTIVE</span>;
            case "revoked": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-800 rounded">REVOKED</span>;
            case "expired": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 rounded">EXPIRED</span>;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Manage Sessions: {user.firstName} {user.lastName}</h2>
                        <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleForceRevokeAll}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded transition-colors"
                        >
                            <FaSignOutAlt />
                            Force Logout All
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12"><LoadingSpinner /></div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <ul className="divide-y divide-slate-200">
                                {sessions.map((session) => (
                                    <li key={session._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-100 rounded-full">
                                                {getDeviceIcon(session.deviceInfo)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base font-semibold text-slate-900">
                                                        {session.deviceInfo || "Unknown Device"}
                                                    </h3>
                                                    {getStatusBadge(session.status)}
                                                </div>
                                                <div className="text-xs text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <p><span className="font-medium text-slate-700">IP:</span> {session.ipAddress}</p>
                                                    <p><span className="font-medium text-slate-700">OS:</span> {session.operatingSystem}</p>
                                                    <p><span className="font-medium text-slate-700">Browser:</span> {session.browser}</p>
                                                    <p><span className="font-medium text-slate-700">Active:</span> {new Date(session.lastActivityAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {session.status === "active" && (
                                            <button
                                                onClick={() => handleForceRevoke(session._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Force Revoke Session"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        )}
                                    </li>
                                ))}
                                {sessions.length === 0 && (
                                    <li className="p-8 text-center text-slate-500">No sessions found for this user.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSessionModal;
