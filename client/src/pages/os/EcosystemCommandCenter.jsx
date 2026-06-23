import { useState, useEffect } from 'react';
import { FaServer, FaShieldAlt, FaChartArea, FaRocket } from 'react-icons/fa';

const EcosystemCommandCenter = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white flex items-center gap-4">
                    <FaRocket className="text-indigo-500" /> Ecosystem Command Center
                </h1>
                <p className="text-slate-400 mt-2 text-lg">Global overview of the G-Axis Operating System.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* System Health Module */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaServer className="text-emerald-500" /> System Health
                        </h2>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded uppercase font-bold">Optimal</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Identity Engine</span>
                            <span className="text-white font-medium">99.99%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Workflow Engine</span>
                            <span className="text-white font-medium">100%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">API Gateway</span>
                            <span className="text-white font-medium">99.95%</span>
                        </div>
                    </div>
                </div>

                {/* Security Posture Module */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaShieldAlt className="text-blue-500" /> Security Posture
                        </h2>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded uppercase font-bold">Secure</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Active Threats</span>
                            <span className="text-white font-medium">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Failed Logins (1h)</span>
                            <span className="text-amber-400 font-medium">12</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Quarantined Apps</span>
                            <span className="text-white font-medium">0</span>
                        </div>
                    </div>
                </div>

                {/* Ecosystem Telemetry */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaChartArea className="text-purple-500" /> Ecosystem Telemetry
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Active Tenants</span>
                            <span className="text-white font-medium">142</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Marketplace Installs</span>
                            <span className="text-white font-medium">1,204</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Event Bus Msgs/sec</span>
                            <span className="text-emerald-400 font-medium">4,521</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcosystemCommandCenter;
