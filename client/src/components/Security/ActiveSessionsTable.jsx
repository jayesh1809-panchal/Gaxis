import React, { useState, useEffect } from "react";
import securityService from "../../services/securityService";
import { toast } from "react-hot-toast";

const ActiveSessionsTable = ({ applicationId }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, [applicationId]);

    const loadSessions = async () => {
        try {
            const res = await securityService.getSessions(applicationId);
            setSessions(res.data);
        } catch (error) {
            toast.error("Failed to load active sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (sessionId) => {
        if (!window.confirm("Are you sure you want to revoke this session? The user will be logged out immediately.")) {
            return;
        }

        try {
            await securityService.revokeSession(applicationId, sessionId);
            toast.success("Session revoked");
            loadSessions();
        } catch (error) {
            toast.error("Failed to revoke session");
        }
    };

    if (loading) return <div>Loading active sessions...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
            <p className="text-sm text-gray-500 mb-4">
                Monitor and manage active user sessions for this application.
            </p>

            {sessions.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No active sessions found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device / Browser</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sessions.map((session) => (
                                <tr key={session._id}>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        <div className="font-medium">{session.userId?.firstName} {session.userId?.lastName}</div>
                                        <div className="text-gray-500 text-xs">{session.userId?.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        <div>{session.browser}</div>
                                        <div className="text-gray-500 text-xs">{session.deviceInfo}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{session.ipAddress}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(session.lastActivityAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                        <button
                                            onClick={() => handleRevoke(session._id)}
                                            className="text-red-600 hover:text-red-900 font-medium"
                                        >
                                            Revoke
                                        </button>
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

export default ActiveSessionsTable;
