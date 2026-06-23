import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { FaSearch, FaUserTag } from "react-icons/fa";
import { getRoles } from "../services/roleService";
import { getUserRoles, assignRoles, removeRole } from "../services/userRoleService";
import RoleGroup from "./RoleGroup";
import LoadingSpinner from "./LoadingSpinner";

const UserRoleModal = ({ isOpen, onClose, user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data State
    const [allRoles, setAllRoles] = useState([]);
    const [initialSelectedIds, setInitialSelectedIds] = useState([]);
    const [currentSelectedIds, setCurrentSelectedIds] = useState([]);
    
    // Filter State
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen && user) {
            fetchData();
        } else {
            // Reset state when closing
            setAllRoles([]);
            setInitialSelectedIds([]);
            setCurrentSelectedIds([]);
            setSearch("");
        }
    }, [isOpen, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch all roles (Limit 200 should cover enterprise scale)
            const roleRes = await getRoles({ limit: 200, status: "active" });
            const roles = roleRes.data;
            setAllRoles(roles);

            // 2. Fetch user's current assignments
            const userRoleRes = await getUserRoles(user._id);
            const assignedIds = userRoleRes.data.map(ur => ur.roleId._id);
            
            setInitialSelectedIds(assignedIds);
            setCurrentSelectedIds(assignedIds);

        } catch (error) {
            toast.error("Failed to load roles data");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (roleId, isChecked) => {
        if (isChecked) {
            setCurrentSelectedIds(prev => [...prev, roleId]);
        } else {
            setCurrentSelectedIds(prev => prev.filter(id => id !== roleId));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Calculate Delta
            const toAdd = currentSelectedIds.filter(id => !initialSelectedIds.includes(id));
            const toRemove = initialSelectedIds.filter(id => !currentSelectedIds.includes(id));

            // 1. Process Additions (Bulk POST)
            if (toAdd.length > 0) {
                await assignRoles(user._id, toAdd);
            }

            // 2. Process Removals (Iterative DELETE)
            for (const roleId of toRemove) {
                await removeRole(user._id, roleId);
            }

            toast.success("Roles updated successfully");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update roles");
        } finally {
            setSaving(false);
        }
    };

    // Filter and Group Logic
    const groupedRoles = useMemo(() => {
        if (!allRoles.length) return {};

        // Apply Search Filter
        const filtered = allRoles.filter(role => {
            const searchTerm = search.toLowerCase();
            return role.name.toLowerCase().includes(searchTerm) || 
                   role.code.toLowerCase().includes(searchTerm);
        });

        // Group by Role Type (SYSTEM vs APPLICATION)
        return filtered.reduce((acc, role) => {
            if (!acc[role.roleType]) {
                acc[role.roleType] = [];
            }
            acc[role.roleType].push(role);
            return acc;
        }, {});
    }, [allRoles, search]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FaUserTag size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                Manage Roles: {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-slate-500 font-mono mt-0.5">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search role name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Content / Matrix */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : Object.keys(groupedRoles).length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No roles match your search.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Render SYSTEM roles first, then APPLICATION roles */}
                            {["SYSTEM", "APPLICATION"].map(type => {
                                if (!groupedRoles[type]) return null;
                                return (
                                    <RoleGroup
                                        key={type}
                                        typeName={type}
                                        roles={groupedRoles[type]}
                                        selectedIds={currentSelectedIds}
                                        onToggle={handleToggle}
                                        disabled={saving}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-lg">
                    <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{currentSelectedIds.length}</span> roles selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? "Saving..." : "Save Assignments"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRoleModal;
