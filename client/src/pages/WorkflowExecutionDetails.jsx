import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaSpinner } from "react-icons/fa";
import { getExecutionById } from "../services/workflowService";
import LoadingSpinner from "../components/LoadingSpinner";

const WorkflowExecutionDetails = () => {
    const { executionId } = useParams();
    const navigate = useNavigate();
    const [execution, setExecution] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExecution();
    }, [executionId]);

    const loadExecution = async () => {
        try {
            const res = await getExecutionById(executionId);
            setExecution(res.data.data);
        } catch (error) {
            toast.error("Failed to load execution details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!execution) return <div>Execution not found</div>;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <FaCheckCircle className="text-green-500" />;
            case 'failed': return <FaTimesCircle className="text-red-500" />;
            case 'running': return <FaSpinner className="text-blue-500 animate-spin" />;
            default: return <FaClock className="text-slate-500" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
            >
                <FaArrowLeft className="mr-2" /> Back
            </button>

            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Execution Overview
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Workflow: <span className="font-semibold">{execution.workflowId?.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md border border-slate-200 shadow-sm">
                        {getStatusIcon(execution.status)}
                        <span className="font-semibold capitalize text-slate-700">{execution.status}</span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Started At</p>
                        <p className="mt-1 text-slate-900">{new Date(execution.startedAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Duration</p>
                        <p className="mt-1 text-slate-900">{execution.durationMs ? `${execution.durationMs}ms` : 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-sm font-medium text-slate-500 mb-2">Trigger Payload</p>
                        <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-sm overflow-x-auto">
                            {JSON.stringify(execution.triggerEventPayload, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Node Execution Logs</h3>
            <div className="space-y-4">
                {execution.nodeExecutions.map((node, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">Node ID: {node.nodeId}</span>
                            <div className="flex items-center space-x-2">
                                {getStatusIcon(node.status)}
                                <span className="text-sm capitalize">{node.status}</span>
                            </div>
                        </div>
                        <div className="p-4">
                            {node.error && (
                                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                    <p className="text-red-700 text-sm font-bold">Error:</p>
                                    <p className="text-red-600 text-sm mt-1">{node.error}</p>
                                </div>
                            )}
                            {node.output && (
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-2">Output Payload</p>
                                    <pre className="bg-slate-100 text-slate-800 p-3 rounded border border-slate-200 text-xs overflow-x-auto">
                                        {JSON.stringify(node.output, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {execution.errorLogs && execution.errorLogs.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-red-600 mb-4">System Error Logs</h3>
                    <div className="space-y-4">
                        {execution.errorLogs.map((log, idx) => (
                            <div key={idx} className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="font-bold text-red-800">{log.message}</p>
                                <pre className="mt-2 text-xs text-red-600 overflow-x-auto">{log.stack}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowExecutionDetails;
