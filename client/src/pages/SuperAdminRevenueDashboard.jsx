import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FaShieldAlt, FaUsers, FaArrowUp, FaMoneyBillWave, FaUndo } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const SuperAdminRevenueDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPlatformRevenue = async () => {
        try {
            setLoading(true);
            const res = await api.get("/revenue/admin");
            setData(res.data.data);
        } catch (error) {
            console.error("Failed to load admin revenue details", error);
            toast.error("Failed to load platform-wide revenue intelligence");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlatformRevenue();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!data) return <div className="p-8 text-center text-slate-500">Error loading data.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaShieldAlt className="text-blue-600" /> Platform Revenue Master
                    </h1>
                    <p className="text-slate-500 mt-1">Super Administrator command center for G-Axis ecosystem financials.</p>
                </div>
                <button
                    onClick={loadPlatformRevenue}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                    <FaUndo className="text-slate-400 text-xs" /> Refresh Analytics
                </button>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Platform Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Platform Revenue</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            ${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                        <FaArrowUp />
                        <span>All-time settled invoice fees</span>
                    </div>
                </div>

                {/* MRR */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform MRR</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            ${data.mrr.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaMoneyBillWave className="text-slate-400" />
                        <span>Monthly recurring revenue rate</span>
                    </div>
                </div>

                {/* ARR */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform ARR</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            ${data.arr.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaChartLine className="text-slate-400" />
                        <span>Aggregated run-rate valuation</span>
                    </div>
                </div>

                {/* Subscriptions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform Subscriptions</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            {data.activeSubscriptionsCount}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaUsers className="text-slate-400" />
                        <span>Active tenant connections</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 6-Month Subscriber Trend */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Subscribers & Revenue Growth Trend</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: "#2563eb" }} activeDot={{ r: 8 }} name="Monthly Revenue ($)" />
                                <Line type="monotone" dataKey="subscribers" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} name="Subscribers Count" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* App Revenue Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Revenue Share by Application</h2>
                    <div className="flex-1 flex items-center justify-center h-64 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.appBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.appBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Application Revenue Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Application Performance Catalog</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Revenue and code details for each application published to the G-Axis Marketplace.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                                <th className="p-4 font-semibold">Application Name</th>
                                <th className="p-4 font-semibold">App Code</th>
                                <th className="p-4 font-semibold">Monthly MRR Contribution</th>
                                <th className="p-4 font-semibold">Run-Rate Valuation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {data.appBreakdown.map((app, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-900 font-bold">{app.name}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-xs font-mono">
                                            {app.code}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">${app.value.toLocaleString()}</td>
                                    <td className="p-4 text-slate-600">${(app.value * 12).toLocaleString()}</td>
                                </tr>
                            ))}
                            {data.appBreakdown.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        No active revenue-producing marketplace applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminRevenueDashboard;
