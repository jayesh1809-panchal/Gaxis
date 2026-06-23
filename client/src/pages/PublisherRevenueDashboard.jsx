import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FaChartLine, FaUsers, FaArrowUp, FaMoneyBillWave, FaUndo } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

const PublisherRevenueDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadRevenueDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get("/revenue/publisher");
            setData(res.data.data);
        } catch (error) {
            console.error("Failed to load publisher revenue data", error);
            toast.error("Failed to load publisher analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRevenueDetails();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!data) return <div className="p-8 text-center text-slate-500">Error loading data.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Publisher Revenue Hub</h1>
                    <p className="text-slate-500 mt-1">Analytics overview of application subscriptions, revenue, and churn.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadRevenueDetails}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                    >
                        <FaUndo className="text-slate-400 text-xs" /> Refresh
                    </button>
                </div>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* MRR Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Monthly Recurring Revenue</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            ${data.mrr.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                        <FaArrowUp />
                        <span>+8.4% monthly growth</span>
                    </div>
                </div>

                {/* ARR Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Annual Recurring Revenue</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            ${data.arr.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaMoneyBillWave className="text-slate-400" />
                        <span>Run-rate based on active subs</span>
                    </div>
                </div>

                {/* Subscriptions Count */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            {data.activeSubscriptionsCount}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaUsers className="text-slate-400" />
                        <span>Total paying organization tenants</span>
                    </div>
                </div>

                {/* Churn Rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Subscriber Churn</span>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            {data.churnRate}%
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
                        <FaChartLine className="text-slate-400" />
                        <span>Healthy industry-standard cap</span>
                    </div>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue Growth (6-Month Trend)</h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: "#2563eb" }} activeDot={{ r: 8 }} name="Monthly Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Customers Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Top Customers (by Revenue Contribution)</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Summary of top enterprise accounts contributing to subscription revenue.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                                <th className="p-4 font-semibold">Tenant Name</th>
                                <th className="p-4 font-semibold">Active Plan Details</th>
                                <th className="p-4 font-semibold">Monthly MRR Contribution</th>
                                <th className="p-4 font-semibold">Estimated Annual Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {data.topCustomers.map((c, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-900 font-bold">{c.name}</td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">{c.apps.join(", ") || "Custom Premium Plan"}</td>
                                    <td className="p-4 font-bold text-slate-800">${c.revenue.toLocaleString()}</td>
                                    <td className="p-4 text-slate-600">${(c.revenue * 12).toLocaleString()}</td>
                                </tr>
                            ))}
                            {data.topCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        No subscription data compiled for owned applications.
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

export default PublisherRevenueDashboard;
