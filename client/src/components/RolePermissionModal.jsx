import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { FaSearch, FaLock, FaShieldAlt } from "react-icons/fa";
import { getPermissions } from "../services/permissionService";
import { getRolePermissions, assignPermissions, removePermission } from "../services/rolePermissionService";
import PermissionGroup from "./PermissionGroup";
import LoadingSpinner from "./LoadingSpinner";

const RolePermissionModal = ({ isOpen, onClose, role }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data State
    const [allPermissions, setAllPermissions] = useState([]);
    const [initialSelectedIds, setInitialSelectedIds] = useState([]);
    const [currentSelectedIds, setCurrentSelectedIds] = useState([]);
    
    // Filter State
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen && role) {
            fetchData();
        } else {
            // Reset state when closing
            setAllPermissions([]);
            setInitialSelectedIds([]);
            setCurrentSelectedIds([]);
            setSearch("");
        }
    }, [isOpen, role]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch all system permissions (Limit 500 should cover enterprise scale)
            const permRes = await getPermissions({ limit: 500, status: "active" });
            const permissions = permRes.data;
            setAllPermissions(permissions);

            // 2. Fetch role's current assignments
            const rolePermRes = await getRolePermissions(role._id);
            const assignedIds = rolePermRes.data.map(rp => rp.permissionId._id);
            
            setInitialSelectedIds(assignedIds);
            setCurrentSelectedIds(assignedIds);

        } catch (error) {
            toast.error("Failed to load permissions data");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (permissionId, isChecked) => {
        if (role.isSystemRole) return; // Prevent modification if system role

        if (isChecked) {
            setCurrentSelectedIds(prev => [...prev, permissionId]);
        } else {
            setCurrentSelectedIds(prev => prev.filter(id => id !== permissionId));
        }
    };

    const handleSave = async () => {
        if (role.isSystemRole) {
            toast.error("Cannot modify permissions for a System Role");
            return;
        }

        try {
            setSaving(true);
            
            // Calculate Delta
            const toAdd = currentSelectedIds.filter(id => !initialSelectedIds.includes(id));
            const toRemove = initialSelectedIds.filter(id => !currentSelectedIds.includes(id));

            // 1. Process Additions (Bulk POST)
            if (toAdd.length > 0) {
                await assignPermissions(role._id, toAdd);
            }

            // 2. Process Removals (Iterative DELETE)
            // If API supported bulk delete we would use it, but requirement defined DELETE /:id
            for (const permId of toRemove) {
                await removePermission(role._id, permId);
            }

            toast.success("Permissions updated successfully");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update permissions");
        } finally {
            setSaving(false);
        }
    };

    // Filter and Group Logic
    const groupedPermissions = useMemo(() => {
        if (!allPermissions.length) return {};

        // Apply Search Filter
        const filtered = allPermissions.filter(perm => {
            const searchTerm = search.toLowerCase();
            return perm.name.toLowerCase().includes(searchTerm) || 
                   perm.code.toLowerCase().includes(searchTerm);
        });

        // Group by Module
        return filtered.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        }, {});
    }, [allPermissions, search]);

    if (!isOpen || !role) return null;

    const isSystemRole = role.isSystemRole;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FaShieldAlt size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                Manage Permissions: {role.name}
                                {isSystemRole && <FaLock className="text-yellow-500" size={14} title="System Role" />}
                            </h3>
                            <p className="text-sm text-slate-500 font-mono mt-0.5">{role.code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Warning Banner for System Roles */}
                {isSystemRole && (
                    <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                            <span>🔒</span> This is a core System Role. Its permissions are read-only and managed by the system.
                        </p>
                    </div>
                )}

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search permission name or code..."
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
                    ) : Object.keys(groupedPermissions).length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No permissions match your search.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                                <PermissionGroup
                                    key={moduleName}
                                    moduleName={moduleName}
                                    permissions={perms}
                                    selectedIds={currentSelectedIds}
                                    onToggle={handleToggle}
                                    disabled={isSystemRole || saving}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-lg">
                    <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{currentSelectedIds.length}</span> permissions selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            {isSystemRole ? "Close" : "Cancel"}
                        </button>
                        {!isSystemRole && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? "Saving..." : "Save Assignments"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RolePermissionModal;
