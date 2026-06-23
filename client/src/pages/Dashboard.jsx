import { useState, useEffect } from "react";
import { getMySessions } from "../services/sessionService";
import { getApplications } from "../services/applicationService";
import { useAuth } from "../contexts/AuthContext";
import { FaShieldAlt, FaDesktop, FaClock, FaLock, FaExternalLinkAlt, FaRocket, FaCrown } from "react-icons/fa";
import { toast } from "react-hot-toast";

const Dashboard = () => {
    const { currentUser, hasPermission, hasRole, permissions } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [activeSessionsCount, setActiveSessionsCount] = useState(0);
    const [applications, setApplications] = useState([]);
    const [securityStats, setSecurityStats] = useState({
        totalEventsToday: 0,
        failedLogins: 0,
        mfaEvents: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch user sessions
                const sessionRes = await getMySessions();
                setSessions(sessionRes.data);
                const active = sessionRes.data.filter(s => s.status === 'active');
                setActiveSessionsCount(active.length);

                // Fetch all applications for the launcher
                const appRes = await getApplications({ limit: 50 });
                setApplications(appRes.data || []);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        const fetchAuditStats = async () => {
            if (!hasPermission('audit_logs.read')) return;
            
            try {
                const { default: auditService } = await import('../services/auditService');
                const today = new Date().toISOString().split('T')[0];
                const [totalRes, failedRes, mfaRes] = await Promise.all([
                    auditService.getAuditLogs({ startDate: today, limit: 1 }),
                    auditService.getAuditLogs({ action: "USER_LOGIN", status: "failed", limit: 1 }),
                    auditService.getAuditLogs({ category: "MFA", limit: 1 })
                ]);
                
                setSecurityStats({
                    totalEventsToday: totalRes.pagination?.total || 0,
                    failedLogins: failedRes.pagination?.total || 0,
                    mfaEvents: mfaRes.pagination?.total || 0
                });
            } catch (error) {
                console.error("Failed to fetch audit stats", error);
            }
        };

        fetchAuditStats();
    }, [hasPermission]);

    // Logic to determine if user has access to a specific product
    const hasAppAccess = (app, index) => {
        // Superadmin has access to everything
        if (hasRole('SUPERADMIN') || hasRole('superadmin') || hasRole('SYSTEM_ADMIN') || hasRole('system_admin')) return true;
        
        // Check if user has specific permission for this app (e.g. 'hrms.access' or 'app_hrms.access')
        const appCodeLower = app.code.toLowerCase();
        const hasExplicitAccess = permissions.some(p => p.includes(appCodeLower));
        
        if (hasExplicitAccess) return true;

        // Fallback Demo Logic: If user has no specific permissions, grant access to the first app 
        // just to demonstrate the unlocked state, and lock the rest.
        if (permissions.length === 0 && index === 0) return true;

        return false;
    };

    const handleAppClick = (app, hasAccess) => {
        if (hasAccess) {
            // Trigger Service Provider (App) initiated SSO
            let targetUrl = app.frontendUrl || (app.redirectUris && app.redirectUris[0]);
            
            const code = (app.code || '').toUpperCase();
            const name = (app.name || '').toUpperCase();

            if (code === 'EDUPATH' || name.includes('EDUPATH') || (app.backendUrl && app.backendUrl.includes('5021')) || (targetUrl && targetUrl.includes('5021'))) {
                // Edupath uses frontend-initiated PKCE SSO
                let base = app.frontendUrl || (targetUrl ? new URL(targetUrl).origin : null) || app.backendUrl;
                
                if (base) {
                    // For local development, redirect backend port 5021 to frontend dev server 5173
                    if (base.includes('localhost:5021') || base.includes('127.0.0.1:5021')) {
                        base = base.replace('5021', '5173');
                    }
                    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
                    targetUrl = `${cleanBase}/sso-init`;
                } else {
                    targetUrl = window.location.hostname === 'localhost' ? "http://localhost:5173/sso-init" : "/sso-init";
                }
            } else if (app.backendUrl) {
                // If backendUrl is defined, use it to start the SSO flow
                const baseUrl = app.backendUrl.endsWith('/') ? app.backendUrl.slice(0, -1) : app.backendUrl;
                targetUrl = `${baseUrl}/api/auth/sso/login`;
            }

            if (targetUrl) {
                window.open(targetUrl, '_blank');
            } else {
                toast.error("Application URL not configured properly.");
            }
        } else {
            // Marketing Strategy: Tease the user about the locked product
            toast("This premium feature is locked. Please upgrade or contact your administrator for access to " + app.name + ".", {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 -m-6 p-6 font-sans">
            {/* Attractive Header Section */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <div className="mb-4 bg-white/10 w-fit p-3 rounded-xl backdrop-blur-md border border-white/20">
                            {/* Logo injection */}
                            <img 
                                src="/assets/images/Final-logo-g-axis-transparent.png" 
                                alt="G-Axis Logo" 
                                className="h-12 object-contain filter brightness-0 invert" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            {/* Fallback if logo fails to load */}
                            <span className="text-xl font-bold tracking-wider ml-2 hidden">G-AXIS ONE</span>
                        </div>
                        <h2 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                            Welcome Back, {currentUser?.firstName || 'User'}!
                        </h2>
                        <p className="text-blue-100 text-lg max-w-2xl">
                            Your centralized command center. Access all your assigned products and manage your workspace from one secure location.
                        </p>
                    </div>
                </div>
            </div>

            {/* Application Launcher Grid */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <FaRocket className="text-2xl text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Your Products</h3>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
                        No products available in the ecosystem yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {applications.map((app, index) => {
                            const isUnlocked = hasAppAccess(app, index);
                            
                            return (
                                <div 
                                    key={app._id}
                                    onClick={() => handleAppClick(app, isUnlocked)}
                                    className={`
                                        relative rounded-xl p-4 border transition-all duration-200 group flex flex-col items-center justify-center text-center h-32
                                        ${isUnlocked 
                                            ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer' 
                                            : 'bg-slate-50 border-slate-200 opacity-90 cursor-not-allowed hover:opacity-100'
                                        }
                                    `}
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 mb-3 rounded-lg flex items-center justify-center text-2xl shadow-sm border ${isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        <FaDesktop />
                                    </div>
                                    
                                    {/* Title */}
                                    <h4 className={`text-sm font-semibold tracking-tight line-clamp-1 w-full px-1 ${isUnlocked ? 'text-slate-800 group-hover:text-blue-700 transition-colors' : 'text-slate-600'}`}>
                                        {app.name}
                                    </h4>

                                    {/* Locked Badge (Floating) */}
                                    {!isUnlocked && (
                                        <div className="absolute top-2 right-2 bg-slate-200/80 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase">
                                            <FaLock />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Security Overview (Restyled to match new theme) */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <FaShieldAlt className="text-2xl text-emerald-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Security Overview</h3>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100">
                            <p className="text-sm font-medium text-slate-500 mb-1">Active Sessions</p>
                            <p className="text-3xl font-black text-slate-800">{activeSessionsCount}</p>
                        </div>
                        {hasPermission('audit_logs.read') ? (
                            <>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                    <p className="text-sm font-medium text-blue-600 mb-1">Events Today</p>
                                    <p className="text-3xl font-black text-blue-900">{securityStats.totalEventsToday}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                                    <p className="text-sm font-medium text-red-600 mb-1">Failed Logins</p>
                                    <p className="text-3xl font-black text-red-700">{securityStats.failedLogins}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                                    <p className="text-sm font-medium text-emerald-600 mb-1">MFA Events</p>
                                    <p className="text-3xl font-black text-emerald-800">{securityStats.mfaEvents}</p>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-3 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium">
                                <FaLock className="mr-2" /> Missing audit_logs.read permission to view additional security stats.
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;