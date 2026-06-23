import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAVIGATION_CONFIG } from "../routes/navigationConfig";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../contexts/AuthContext";
import { FaSearch } from "react-icons/fa";

const Sidebar = () => {
    const { can } = usePermission();
    const { hasRole } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNavigation = NAVIGATION_CONFIG.filter(item => {
        if (item.requiredPermission && !can(item.requiredPermission)) return false;
        if (item.requiredRole && !hasRole(item.requiredRole)) return false;
        return true;
    });

    const searchedNavigation = filteredNavigation.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-64 h-[calc(100vh-4rem)] bg-slate-900 text-white sticky top-0 flex flex-col border-r border-slate-800">
            {/* Sidebar Header */}
            <div className="p-5 text-2xl font-bold border-b border-slate-800 flex items-center justify-between">
                <span>G-Axis</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">V2</span>
            </div>
            
            {/* Search Bar Container */}
            <div className="p-4 border-b border-slate-800">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-slate-500 text-sm" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Scrollable Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {searchedNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium text-sm transition-all duration-200 ${
                                isActive 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                                : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                            }`
                        }
                    >
                        <item.icon className="text-lg flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                    </NavLink>
                ))}
                {searchedNavigation.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                        No menu items match search
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Sidebar;