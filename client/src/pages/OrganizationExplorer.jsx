import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaSitemap, FaPlus, FaTrash, FaEdit, FaUserPlus, FaFolderOpen, FaFolder, FaChevronDown, FaChevronRight } from "react-icons/fa";
import api from "../api/axios";
import {
    getOrganizationUnits,
    createOrganizationUnit,
    updateOrganizationUnit,
    deleteOrganizationUnit
} from "../services/governanceService";
import LoadingSpinner from "../components/LoadingSpinner";

const OrganizationExplorer = () => {
    const [units, setUnits] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        type: "ORGANIZATION",
        parentId: "",
        description: "",
        members: []
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [unitRes, userRes] = await Promise.all([
                getOrganizationUnits(),
                api.get("/users")
            ]);
            setUnits(unitRes.data.data);
            setUsers(userRes.data.data || []);
            
            // Expand all units initially
            const expanded = {};
            unitRes.data.data.forEach(u => {
                expanded[u._id] = true;
            });
            setExpandedNodes(expanded);
        } catch (error) {
            console.error("Failed to load organization explorer data", error);
            toast.error("Failed to load organization details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleNode = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectUnit = (unit) => {
        setSelectedUnit(unit);
    };

    const openCreateModal = (parent = null) => {
        setModalMode("create");
        setFormData({
            name: "",
            code: "",
            type: parent ? getNextType(parent.type) : "ORGANIZATION",
            parentId: parent ? parent._id : "",
            description: "",
            members: []
        });
        setIsModalOpen(true);
    };

    const getNextType = (parentType) => {
        switch (parentType) {
            case "ORGANIZATION": return "BUSINESS_UNIT";
            case "BUSINESS_UNIT": return "DIVISION";
            case "DIVISION": return "DEPARTMENT";
            case "DEPARTMENT": return "TEAM";
            default: return "TEAM";
        }
    };

    const openEditModal = (unit) => {
        setModalMode("edit");
        setFormData({
            name: unit.name,
            code: unit.code,
            type: unit.type,
            parentId: unit.parentId ? unit.parentId._id || unit.parentId : "",
            description: unit.description || "",
            members: unit.members ? unit.members.map(m => m._id || m) : []
        });
        setIsModalOpen(true);
    };

    const handleDeleteUnit = async (id) => {
        if (!window.confirm("Are you sure you want to delete this organization unit?")) return;
        try {
            await deleteOrganizationUnit(id);
            toast.success("Organization unit deleted successfully");
            setSelectedUnit(null);
            loadData();
        } catch (err) {
            toast.error("Failed to delete organization unit");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === "create") {
                await createOrganizationUnit(formData);
                toast.success("Organization unit created successfully");
            } else {
                await updateOrganizationUnit(selectedUnit._id, formData);
                toast.success("Organization unit updated successfully");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save organization unit");
        }
    };

    const handleMemberToggle = (userId) => {
        setFormData(prev => {
            const isMember = prev.members.includes(userId);
            const updated = isMember
                ? prev.members.filter(id => id !== userId)
                : [...prev.members, userId];
            return { ...prev, members: updated };
        });
    };

    // Build hierarchical tree
    const buildTree = (parentId = null) => {
        return units
            .filter(u => {
                const pid = u.parentId ? (u.parentId._id || u.parentId) : null;
                return pid === parentId;
            })
            .map(u => ({
                ...u,
                children: buildTree(u._id)
            }));
    };

    const treeData = buildTree(null);

    // Render tree recursively
    const renderTreeNode = (node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node._id];
        const isSelected = selectedUnit && selectedUnit._id === node._id;

        return (
            <div key={node._id} className="ml-4">
                <div className="flex items-center gap-2 py-1.5 hover:bg-slate-100/80 rounded-xl px-3 transition-colors cursor-pointer group">
                    <span onClick={() => toggleNode(node._id)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-700">
                        {hasChildren ? (isExpanded ? <FaChevronDown className="text-[10px]" /> : <FaChevronRight className="text-[10px]" />) : null}
                    </span>
                    <div 
                        onClick={() => handleSelectUnit(node)}
                        className={`flex items-center gap-2 flex-grow py-1 px-2 rounded-lg font-medium text-sm transition-colors ${
                            isSelected 
                            ? "bg-blue-50 text-blue-700 font-semibold" 
                            : "text-slate-700"
                        }`}
                    >
                        {hasChildren ? <FaFolderOpen className="text-blue-500 text-base" /> : <FaFolder className="text-slate-400 text-base" />}
                        <span>{node.name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            {node.type.replace("_", " ")}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); openCreateModal(node); }}
                            title="Add Child Unit"
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <FaPlus className="text-xs" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(node); }}
                            title="Edit Unit"
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <FaEdit className="text-xs" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteUnit(node._id); }}
                            title="Delete Unit"
                            className="p-1.5 hover:bg-slate-200 rounded text-red-500 hover:text-red-700 transition-colors"
                        >
                            <FaTrash className="text-xs" />
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="border-l border-slate-200 ml-5 pl-2 mt-1 space-y-1">
                        {node.children.map(child => renderTreeNode(child))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FaSitemap className="text-blue-600 text-2xl" />
                        Organization Explorer
                    </h1>
                    <p className="text-slate-500 mt-1">Configure your corporate tenant hierarchical entities and user structures.</p>
                </div>
                <button
                    onClick={() => openCreateModal(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                    <FaPlus className="text-xs" />
                    Create Root Organization
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tree Column */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">Organizational Tree</h2>
                    <div className="flex-grow overflow-y-auto space-y-1">
                        {treeData.length > 0 ? (
                            treeData.map(node => renderTreeNode(node))
                        ) : (
                            <div className="text-center text-slate-500 py-12 text-sm">
                                No organization units created yet. Create a root organization.
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                    {selectedUnit ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedUnit.name}</h2>
                                    <p className="text-slate-500 mt-0.5 font-mono text-sm">Code: {selectedUnit.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(selectedUnit)}
                                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors"
                                    >
                                        <FaEdit className="text-xs text-slate-500" />
                                        Edit Unit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUnit(selectedUnit._id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 border border-red-200 transition-colors"
                                    >
                                        <FaTrash className="text-xs" />
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Unit Details</h3>
                                    <div className="mt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <span className="text-xs text-slate-500 block font-medium">Type</span>
                                            <span className="text-sm font-semibold text-slate-800 uppercase">{selectedUnit.type.replace("_", " ")}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 block font-medium">Description</span>
                                            <span className="text-sm text-slate-700">{selectedUnit.description || "No description provided."}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Members ({selectedUnit.members?.length || 0})</span>
                                    </h3>
                                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                        {selectedUnit.members && selectedUnit.members.length > 0 ? (
                                            selectedUnit.members.map(member => (
                                                <div key={member._id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                                                        <p className="text-xs text-slate-500">{member.email}</p>
                                                    </div>
                                                    {member.designation && (
                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold border border-blue-100">
                                                            {member.designation}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-500 text-sm text-center py-6 border border-dashed border-slate-200 rounded-xl">
                                                No members assigned to this unit.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-slate-500 text-sm py-16">
                            <FaSitemap className="text-slate-300 text-5xl mb-4" />
                            <span>Select an organizational unit from the tree to view its details.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">{modalMode === "create" ? "Add Organization Unit" : "Edit Organization Unit"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Engineering Dept"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="ENG_DEPT"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="ORGANIZATION">Organization</option>
                                            <option value="BUSINESS_UNIT">Business Unit</option>
                                            <option value="DIVISION">Division</option>
                                            <option value="DEPARTMENT">Department</option>
                                            <option value="TEAM">Team</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Parent Unit</label>
                                        <select
                                            value={formData.parentId}
                                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">None (Root Node)</option>
                                            {units
                                                .filter(u => selectedUnit ? u._id !== selectedUnit._id : true)
                                                .map(u => (
                                                    <option key={u._id} value={u._id}>{u.name} ({u.type})</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        rows="2"
                                        placeholder="Add unit details..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Members Assignment</label>
                                    <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto p-3 space-y-1.5 bg-slate-50">
                                        {users.map(u => (
                                            <label key={u._id} className="flex items-center gap-3 cursor-pointer py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.members.includes(u._id)}
                                                    onChange={() => handleMemberToggle(u._id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                />
                                                <span className="text-sm text-slate-700">{u.firstName} {u.lastName} ({u.email})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationExplorer;
