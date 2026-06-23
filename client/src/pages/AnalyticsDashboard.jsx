import React, { useState, useEffect } from "react";
import { getSnapshot, getMetrics, getRecentEvents, exportReport } from "../services/analyticsService";
import { toast } from "react-hot-toast";
import { FaChartLine, FaDownload, FaUsers, FaCubes, FaNetworkWired, FaProjectDiagram } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
        <div className="p-5 flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${colorClass}`}>
                {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
                <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
                    <dd className="text-2xl font-bold text-slate-900">{value}</dd>
                </dl>
            </div>
        </div>
    </div>
);

const AnalyticsDashboard = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const [snapshot, setSnapshot] = useState({});
    const [metrics, setMetrics] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalView, setGlobalView] = useState(false);

    useEffect(() => {
        loadData();
    }, [globalView]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [snapRes, metRes, evRes] = await Promise.all([
                getSnapshot(globalView),
                getMetrics('daily', 7, globalView),
                getRecentEvents()
            ]);
            setSnapshot(snapRes.data.data || {});
            setMetrics(metRes.data.data || []);
            setEvents(evRes.data.data || []);
        } catch (error) {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await exportReport();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'analytics_report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Export failed");
        }
    };

    // Transform metrics for Recharts
    const chartDataMap = {};
    metrics.forEach(m => {
        const date = new Date(m.periodStartDate).toLocaleDateString();
        if (!chartDataMap[date]) chartDataMap[date] = { date };
        chartDataMap[date][m.metricName] = m.value;
    });
    const chartData = Object.values(chartDataMap);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <FaChartLine className="mr-3 text-indigo-600" /> Platform Analytics
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Insights and usage metrics across {globalView ? 'the entire ecosystem' : 'your tenant'}.
                    </p>
                </div>
                <div className="flex space-x-4">
                    {isSuperAdmin && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-700">Global View:</span>
                            <button 
                                onClick={() => setGlobalView(!globalView)}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${globalView ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${globalView ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                    >
                        <FaDownload className="mr-2 -ml-1 h-4 w-4 text-slate-500" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard 
                    title="Active Users" 
                    value={snapshot.activeUsers || 0} 
                    icon={<FaUsers className="text-white text-xl" />} 
                    colorClass="bg-blue-500" 
                />
                <StatCard 
                    title="Installed Apps" 
                    value={snapshot.installedAppsCount || 0} 
                    icon={<FaCubes className="text-white text-xl" />} 
                    colorClass="bg-green-500" 
                />
                <StatCard 
                    title="Workflow Executions" 
                    value={snapshot.workflowRunsInPeriod || 0} 
                    icon={<FaNetworkWired className="text-white text-xl" />} 
                    colorClass="bg-purple-500" 
                />
                <StatCard 
                    title="Events Delivered" 
                    value={snapshot.eventsDeliveredInPeriod || 0} 
                    icon={<FaProjectDiagram className="text-white text-xl" />} 
                    colorClass="bg-orange-500" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Line Chart */}
                <div className="bg-white shadow rounded-lg p-6 border border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Daily Activity Trends</h3>
                    <div className="h-72">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="daily_logins" name="Logins" stroke="#3b82f6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="daily_workflow_runs" name="Workflows" stroke="#8b5cf6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Not enough data to display chart</div>
                        )}
                    </div>
                </div>

                {/* Event Logs */}
                <div className="bg-white shadow rounded-lg p-6 border border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Recent Platform Events</h3>
                    <div className="overflow-y-auto h-72">
                        <ul className="divide-y divide-slate-200">
                            {events.slice(0, 20).map((ev, i) => (
                                <li key={i} className="py-3 flex">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-slate-900">{ev.eventType}</p>
                                        <p className="text-xs text-slate-500">{new Date(ev.timestamp).toLocaleString()} • Actor: {ev.actorId?.email || 'System'}</p>
                                    </div>
                                </li>
                            ))}
                            {events.length === 0 && <li className="py-3 text-sm text-slate-500">No events found.</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
