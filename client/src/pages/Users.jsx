import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaKey, FaToggleOn, FaToggleOff, FaDesktop } from "react-icons/fa";
import { getUsers, createUser, updateUser, deleteUser, updateUserStatus } from "../services/userService";
import UserModal from "../components/UserModal";
import UserApplicationsModal from "../components/UserApplicationsModal";
import UserRoleModal from "../components/UserRoleModal";
import UserSessionModal from "../components/UserSessionModal";
import { usePermission } from "../hooks/usePermission";
import ConfirmModal from "../components/ConfirmModal";
import UserStatusBadge from "../components/UserStatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { can } = usePermission();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsers({ page, limit, search });
            setUsers(response.data);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadUsers]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleAddClick = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleManageAppsClick = (user) => {
        setSelectedUser(user);
        setIsAppModalOpen(true);
    };

    const handleManageRolesClick = (user) => {
        setSelectedUser(user);
        setIsRoleModalOpen(true);
    };

    const handleManageSessionsClick = (user) => {
        setSelectedUser(user);
        setSessionModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsConfirmOpen(true);
    };

    const handleToggleStatus = async (user) => {
        // Toggle logic: Active <-> Inactive. (Suspended handled manually via edit if needed).
        const newStatus = user.status === "active" ? "inactive" : "active";
        try {
            await updateUserStatus(user._id, newStatus);
            toast.success(`User marked as ${newStatus}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleSaveUser = async (formData) => {
        try {
            if (selectedUser) {
                await updateUser(selectedUser._id, formData);
                toast.success("User updated successfully");
            } else {
                await createUser(formData);
                toast.success("User created successfully");
            }
            setIsUserModalOpen(false);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete._id);
            toast.success("User deleted successfully");
            setIsConfirmOpen(false);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    <FaPlus /> Add User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="relative w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, email or employee ID..."
                            value={search}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role / Dept</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Emp ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Updated</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                                                        <div className="text-sm text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{user.designation || "—"}</div>
                                                <div className="text-sm text-slate-500">{user.department || "—"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {user.employeeId || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <UserStatusBadge status={user.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(user.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3 items-center">
                                                    <button 
                                                        onClick={() => handleManageSessionsClick(user)}
                                                        className="text-amber-600 hover:text-amber-900"
                                                        title="Manage Sessions"
                                                    >
                                                        <FaDesktop size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleManageRolesClick(user)}
                                                        className="text-purple-600 hover:text-purple-900 font-medium text-xs px-2 py-1 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                                                        title="Manage Roles"
                                                    >
                                                        Roles
                                                    </button>
                                                    <button 
                                                        onClick={() => handleManageAppsClick(user)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2 py-1 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                                                        title="Manage Apps"
                                                    >
                                                        Apps
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(user)}
                                                        title={user.status === 'active' ? "Deactivate" : "Activate"}
                                                        className={`text-lg ${user.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {user.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditClick(user)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit User"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
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

            {/* Modals */}
            <UserModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onSave={handleSaveUser} 
                user={selectedUser} 
            />

            <UserApplicationsModal 
                isOpen={isAppModalOpen}
                onClose={() => setIsAppModalOpen(false)}
                user={selectedUser}
            />

            <UserRoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                user={selectedUser}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete User" 
                message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This will permanently revoke all their application access.`} 
            />

            {sessionModalOpen && selectedUser && (
                <UserSessionModal
                    user={selectedUser}
                    onClose={() => {
                        setSessionModalOpen(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default Users;
