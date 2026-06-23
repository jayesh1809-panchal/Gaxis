import React, { useState, useEffect } from "react";
import auditService from "../services/auditService";

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        search: "",
        category: "",
        action: "",
        resourceType: "",
        status: "",
        startDate: "",
        endDate: "",
    });

    // Drawer state
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // View mode (table or timeline)
    const [viewMode, setViewMode] = useState("table");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""))
            };
            const response = await auditService.getAuditLogs(params);
            if (response.success) {
                setLogs(response.data);
                setPagination(prev => ({
                    ...prev,
                    page: response.page,
                    total: response.total,
                    pages: response.pages
                }));
            }
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, pagination.limit, viewMode]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        setPagination({ ...pagination, page: 1 });
        fetchLogs();
    };

    const clearFilters = () => {
        setFilters({ search: "", category: "", action: "", resourceType: "", status: "", startDate: "", endDate: "" });
        setPagination({ ...pagination, page: 1 });
        setTimeout(fetchLogs, 0); 
    };

    const handleViewDetails = async (id) => {
        try {
            const response = await auditService.getAuditLogById(id);
            if (response.success) {
                setSelectedLog(response.data);
                setIsDrawerOpen(true);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to load audit log details");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "success": return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">SUCCESS</span>;
            case "failed": return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">FAILED</span>;
            case "warning": return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">WARNING</span>;
            case "info":
            default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">INFO</span>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode("table")}
                        className={`px-4 py-2 rounded-md font-medium ${viewMode === "table" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border"}`}
                    >
                        Table
                    </button>
                    <button
                        onClick={() => setViewMode("timeline")}
                        className={`px-4 py-2 rounded-md font-medium ${viewMode === "timeline" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border"}`}
                    >
                        Timeline
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Advanced Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search user, ip..." className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    <input type="text" name="category" value={filters.category} onChange={handleFilterChange} placeholder="Category (e.g. Authentication)" className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    <input type="text" name="action" value={filters.action} onChange={handleFilterChange} placeholder="Action (e.g. USER_LOGIN)" className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    <input type="text" name="resourceType" value={filters.resourceType} onChange={handleFilterChange} placeholder="Resource Type (e.g. User)" className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200">
                        <option value="">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                    </select>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border rounded px-3 py-2 text-sm w-full bg-transparent dark:text-gray-200" />
                    
                    <div className="flex space-x-2">
                        <button onClick={applyFilters} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm w-full font-medium hover:bg-indigo-700">Filter</button>
                        <button onClick={clearFilters} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm w-full font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">Clear</button>
                    </div>
                </div>
            </div>

            {/* Error handling */}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">{error}</div>}

            {/* Main Content Area */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : viewMode === "table" ? (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action / Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP / UA</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No logs found.</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.timestamp).toLocaleString("en-US", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{log.actorEmail || "System"}</div>
                                            <div className="text-xs text-gray-500">{log.actorUserId?._id || log.actorUserId || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{log.action}</div>
                                            <div className="text-xs text-gray-500">{log.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-200">{log.resourceType || "-"}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[120px]" title={log.resourceId}>{log.resourceId || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="truncate max-w-[150px]">{log.ipAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(log.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleViewDetails(log._id)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                        {logs.map((log) => (
                            <div key={log._id} className="mb-8 pl-6 relative">
                                <span className={`absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-800 ${log.status === "failed" ? "bg-red-500" : log.status === "success" ? "bg-green-500" : log.status === "warning" ? "bg-yellow-500" : "bg-blue-500"}`}></span>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{log.action}</h3>
                                    <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleString()}</time>
                                </div>
                                <p className="mb-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{log.actorEmail}</span> performed action in category <span className="font-medium">{log.category}</span>.
                                </p>
                                <button onClick={() => handleViewDetails(log._id)} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                    Show metadata <svg className="w-3 h-3 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 mt-4 shadow rounded-lg">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> (Total: {pagination.total} logs)
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Details Drawer */}
            {isDrawerOpen && selectedLog && (
                <div className="fixed inset-0 overflow-hidden z-50">
                    <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
                    <section className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700">
                            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-scroll">
                                <div className="px-4 py-6 bg-indigo-600 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-medium text-white" id="slide-over-title">Audit Log Details</h2>
                                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="text-indigo-200 hover:text-white focus:outline-none">
                                            <span className="sr-only">Close panel</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="relative flex-1 px-4 py-6 sm:px-6 text-gray-800 dark:text-gray-200">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</h3>
                                            <p className="mt-1 text-sm font-bold">{selectedLog.action}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</h3>
                                            <p className="mt-1 text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                                            <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                        </div>
                                        <hr className="border-gray-200 dark:border-gray-700" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Actor</h3>
                                            <p className="mt-1 text-sm">{selectedLog.actorEmail}</p>
                                            <p className="text-xs text-gray-400">ID: {selectedLog.actorUserId?._id || selectedLog.actorUserId || "-"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Network & Device</h3>
                                            <p className="mt-1 text-sm">IP: {selectedLog.ipAddress}</p>
                                            <p className="text-xs text-gray-400 break-words mt-1">UA: {selectedLog.userAgent}</p>
                                        </div>
                                        <hr className="border-gray-200 dark:border-gray-700" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Metadata Payload</h3>
                                            <div className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto">
                                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
