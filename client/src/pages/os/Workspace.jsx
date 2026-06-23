import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FaTh, FaSearch, FaBell, FaRobot, FaCog } from 'react-icons/fa';

import UniversalLauncher from '../../components/OS/UniversalLauncher';
import GlobalSearch from '../../components/OS/GlobalSearch';
import UnifiedNotificationHub from '../../components/OS/UnifiedNotificationHub';
import EcosystemCommandCenter from './EcosystemCommandCenter';
import UnifiedSettings from './UnifiedSettings';

// We will embed existing dashboards inside the workspace later via routing

const Workspace = ({ children }) => {
    const [launcherOpen, setLauncherOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Top Bar / Dock */}
            <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-40 relative">
                {/* Start Button */}
                <button 
                    onClick={() => setLauncherOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                >
                    <FaTh /> Apps
                </button>

                {/* Unified Search Bar (Mock Input) */}
                <div 
                    onClick={() => setSearchOpen(true)}
                    className="flex-1 max-w-2xl mx-8 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 text-slate-400 hover:border-slate-500 cursor-text transition-colors"
                >
                    <FaSearch />
                    <span className="text-sm">Search across G-Axis OS (Users, Workflows, Apps...)</span>
                </div>

                {/* Notification Hub & User Menu */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/os/command-center')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Command Center"
                    >
                        <FaRobot size={20} />
                    </button>
                    <button 
                        onClick={() => setNotifOpen(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative"
                    >
                        <FaBell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <button 
                        onClick={() => navigate('/os/settings')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Unified Settings"
                    >
                        <FaCog size={20} />
                    </button>
                </div>
            </header>

            {/* Main Window Area */}
            <main className="flex-1 overflow-auto relative">
                {children}
            </main>

            {/* OS Components Overlay */}
            <UniversalLauncher isOpen={launcherOpen} onClose={() => setLauncherOpen(false)} />
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <UnifiedNotificationHub isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
    );
};

export default Workspace;
