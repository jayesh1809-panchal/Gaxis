import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaToggleOn, FaToggleOff, FaLock } from "react-icons/fa";
import { getPermissions, createPermission, updatePermission, deletePermission, updatePermissionStatus } from "../services/permissionService";
import PermissionModal from "../components/PermissionModal";
import ConfirmModal from "../components/ConfirmModal";
import PermissionStatusBadge from "../components/PermissionStatusBadge";
import PermissionScopeBadge from "../components/PermissionScopeBadge";
import LoadingSpinner from "../components/LoadingSpinner";

const MODULES = [
    "APPLICATIONS",
    "USERS",
    "ROLES",
    "PERMISSIONS",
    "SESSIONS",
    "AUDIT_LOGS",
    "SETTINGS"
];

const Permissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination, Search, Filters
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");
    const [scopeFilter, setScopeFilter] = useState("");
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modals
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState(null);

    const loadPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (moduleFilter) params.module = moduleFilter;
            if (scopeFilter) params.permissionScope = scopeFilter;

            const response = await getPermissions(params);
            setPermissions(response.data);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load permissions");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, moduleFilter, scopeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPermissions();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadPermissions]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handleAddClick = () => {
        setSelectedPermission(null);
        setIsPermissionModalOpen(true);
    };

    const handleEditClick = (permission) => {
        setSelectedPermission(permission);
        setIsPermissionModalOpen(true);
    };

    const handleDeleteClick = (permission) => {
        if (permission.isSystemPermission) {
            toast.error("System permissions cannot be deleted.");
            return;
        }
        setPermissionToDelete(permission);
        setIsConfirmOpen(true);
    };

    const handleToggleStatus = async (permission) => {
        const newStatus = permission.status === "active" ? "inactive" : "active";
        try {
            await updatePermissionStatus(permission._id, newStatus);
            toast.success(`Permission marked as ${newStatus}`);
            loadPermissions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleSavePermission = async (formData) => {
        try {
            if (selectedPermission) {
                await updatePermission(selectedPermission._id, formData);
                toast.success("Permission updated successfully");
            } else {
                await createPermission(formData);
                toast.success("Permission created successfully");
            }
            setIsPermissionModalOpen(false);
            loadPermissions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const confirmDelete = async () => {
        if (!permissionToDelete) return;
        try {
            await deletePermission(permissionToDelete._id);
            toast.success("Permission deleted successfully");
            setIsConfirmOpen(false);
            loadPermissions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete permission");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Permission Management</h1>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    <FaPlus /> Create Custom Permission
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50">
                    <div className="relative w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, code or description..."
                            value={search}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={handleFilterChange(setStatusFilter)}
                        className="py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select
                        value={moduleFilter}
                        onChange={handleFilterChange(setModuleFilter)}
                        className="py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">All Modules</option>
                        {MODULES.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>

                    <select
                        value={scopeFilter}
                        onChange={handleFilterChange(setScopeFilter)}
                        className="py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">All Scopes</option>
                        <option value="SYSTEM">System Scope</option>
                        <option value="APPLICATION">Application Scope</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Permission & Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Module</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scope & App</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {permissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                            No permissions found.
                                        </td>
                                    </tr>
                                ) : (
                                    permissions.map((permission) => (
                                        <tr key={permission._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {permission.isSystemPermission && <FaLock className="text-yellow-500" title="Protected System Permission" />}
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{permission.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{permission.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {permission.module}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="mb-1">
                                                    <PermissionScopeBadge scope={permission.permissionScope} />
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {permission.permissionScope === 'APPLICATION' && permission.applicationId ? `App: ${permission.applicationId.name}` : 'Scope: Global'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <PermissionStatusBadge status={permission.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(permission.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3 items-center">
                                                    <button 
                                                        onClick={() => handleToggleStatus(permission)}
                                                        title={permission.status === 'active' ? "Deactivate" : "Activate"}
                                                        className={`text-lg ${permission.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {permission.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleEditClick(permission)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit Permission"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteClick(permission)}
                                                        className={`${permission.isSystemPermission ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                                        disabled={permission.isSystemPermission}
                                                        title={permission.isSystemPermission ? "Cannot delete System Permissions" : "Delete Permission"}
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PermissionModal 
                isOpen={isPermissionModalOpen} 
                onClose={() => setIsPermissionModalOpen(false)} 
                onSave={handleSavePermission} 
                permission={selectedPermission} 
            />

            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Permission" 
                message={`Are you sure you want to delete the permission ${permissionToDelete?.name}? This action cannot be undone.`} 
            />
        </div>
    );
};

export default Permissions;
