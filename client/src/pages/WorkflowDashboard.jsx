import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaPlus, FaPlay, FaEdit, FaTrash } from "react-icons/fa";
import { getWorkflows, deleteWorkflow } from "../services/workflowService";
import LoadingSpinner from "../components/LoadingSpinner";

const WorkflowDashboard = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const res = await getWorkflows();
            setWorkflows(res.data.data);
        } catch (error) {
            toast.error("Failed to load workflows");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this workflow?")) return;
        try {
            await deleteWorkflow(id);
            toast.success("Workflow deleted successfully");
            loadWorkflows();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete workflow");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Automate processes between your installed applications using an event-driven engine.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/workflows/new")}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    <FaPlus className="mr-2" />
                    New Workflow
                </button>
            </div>

            {workflows.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-slate-500 mb-4">No workflows found. Create one to get started.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
                    <ul className="divide-y divide-slate-200">
                        {workflows.map((wf) => (
                            <li key={wf._id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-blue-600 truncate">{wf.name}</p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    wf.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {wf.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-slate-500">
                                                    Trigger: {wf.trigger?.source} - {wf.trigger?.event}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 gap-4">
                                                <button
                                                    onClick={() => navigate(`/workflows/${wf._id}/executions`)}
                                                    className="text-slate-600 hover:text-blue-600 flex items-center"
                                                >
                                                    <FaPlay className="mr-1" /> Executions
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/workflows/${wf._id}/edit`)}
                                                    className="text-slate-600 hover:text-green-600 flex items-center"
                                                >
                                                    <FaEdit className="mr-1" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(wf._id)}
                                                    className="text-slate-600 hover:text-red-600 flex items-center"
                                                >
                                                    <FaTrash className="mr-1" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WorkflowDashboard;
