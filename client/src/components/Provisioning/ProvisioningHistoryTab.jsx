import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import auditService from "../../services/auditService";
import LoadingSpinner from "../LoadingSpinner";

const ProvisioningHistoryTab = ({ applicationId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch Provisioning category logs
            const response = await auditService.getAuditLogs({ 
                category: "Provisioning", 
                limit: 200 // fetch a large batch so we can filter client-side
            });

            // The backend doesn't support nested metadata querying natively, so we filter here
            const filteredLogs = (response.data || []).filter(log => {
                return log.metadata?.applicationId === applicationId;
            });

            setLogs(filteredLogs);
        } catch (error) {
            toast.error("Failed to load provisioning history");
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-slate-800">Provisioning Audit Trail</h3>
                <button
                    onClick={loadHistory}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Refresh
                </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Application ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Result</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                    No provisioning history found for this application.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {log.actorEmail || "System"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                        {log.metadata?.applicationId || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {log.metadata?.ruleId ? "SUCCESS" : "PROVISIONING_SKIPPED"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProvisioningHistoryTab;
