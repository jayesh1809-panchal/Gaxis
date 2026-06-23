import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaToggleOn, FaToggleOff, FaLock } from "react-icons/fa";
import { getRoles, createRole, updateRole, deleteRole, updateRoleStatus } from "../services/roleService";
import RoleModal from "../components/RoleModal";
import RolePermissionModal from "../components/RolePermissionModal";
import ConfirmModal from "../components/ConfirmModal";
import RoleStatusBadge from "../components/RoleStatusBadge";
import RoleTypeBadge from "../components/RoleTypeBadge";
import LoadingSpinner from "../components/LoadingSpinner";

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination, Search, Filters
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleTypeFilter, setRoleTypeFilter] = useState("");
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modals
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    const loadRoles = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (roleTypeFilter) params.roleType = roleTypeFilter;

            const response = await getRoles(params);
            setRoles(response.data);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, roleTypeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadRoles();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadRoles]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handleAddClick = () => {
        setSelectedRole(null);
        setIsRoleModalOpen(true);
    };

    const handleEditClick = (role) => {
        setSelectedRole(role);
        setIsRoleModalOpen(true);
    };

    const handleManagePermissionsClick = (role) => {
        setSelectedRole(role);
        setIsPermissionModalOpen(true);
    };

    const handleDeleteClick = (role) => {
        if (role.isSystemRole) {
            toast.error("System roles cannot be deleted.");
            return;
        }
        setRoleToDelete(role);
        setIsConfirmOpen(true);
    };

    const handleToggleStatus = async (role) => {
        const newStatus = role.status === "active" ? "inactive" : "active";
        try {
            await updateRoleStatus(role._id, newStatus);
            toast.success(`Role marked as ${newStatus}`);
            loadRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleSaveRole = async (formData) => {
        try {
            if (selectedRole) {
                await updateRole(selectedRole._id, formData);
                toast.success("Role updated successfully");
            } else {
                await createRole(formData);
                toast.success("Role created successfully");
            }
            setIsRoleModalOpen(false);
            loadRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            await deleteRole(roleToDelete._id);
            toast.success("Role deleted successfully");
            setIsConfirmOpen(false);
            loadRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete role");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Role Management</h1>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    <FaPlus /> Create Custom Role
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
                        value={roleTypeFilter}
                        onChange={handleFilterChange(setRoleTypeFilter)}
                        className="py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">All Types</option>
                        <option value="SYSTEM">System Roles</option>
                        <option value="APPLICATION">Application Roles</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role Name & Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type & Scope</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                            No roles found.
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map((role) => (
                                        <tr key={role._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {role.isSystemRole && <FaLock className="text-yellow-500" title="Protected System Role" />}
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{role.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{role.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-500 max-w-xs truncate" title={role.description}>
                                                    {role.description || "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="mb-1">
                                                    <RoleTypeBadge type={role.roleType} />
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {role.roleType === 'APPLICATION' && role.applicationId ? `App: ${role.applicationId.name}` : 'Scope: Global'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <RoleStatusBadge status={role.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(role.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3 items-center">
                                                    <button 
                                                        onClick={() => handleManagePermissionsClick(role)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2 py-1 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                                                        title="Manage Permissions"
                                                    >
                                                        Permissions
                                                    </button>

                                                    <button 
                                                        onClick={() => handleToggleStatus(role)}
                                                        title={role.status === 'active' ? "Deactivate" : "Activate"}
                                                        className={`text-lg ${role.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {role.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleEditClick(role)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit Role"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteClick(role)}
                                                        className={`${role.isSystemRole ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                                        disabled={role.isSystemRole}
                                                        title={role.isSystemRole ? "Cannot delete System Roles" : "Delete Role"}
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

            <RoleModal 
                isOpen={isRoleModalOpen} 
                onClose={() => setIsRoleModalOpen(false)} 
                onSave={handleSaveRole} 
                role={selectedRole} 
            />

            <RolePermissionModal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                role={selectedRole}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Role" 
                message={`Are you sure you want to delete the role ${roleToDelete?.name}? This action cannot be undone.`} 
            />
        </div>
    );
};

export default Roles;
