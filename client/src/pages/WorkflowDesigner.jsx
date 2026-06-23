import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'react-hot-toast';
import { FaSave, FaArrowLeft, FaPlay } from 'react-icons/fa';
import { getWorkflowById, createWorkflow, updateWorkflow } from '../services/workflowService';
import LoadingSpinner from '../components/LoadingSpinner';

const initialNodes = [
  { id: 'trigger_1', type: 'input', position: { x: 250, y: 50 }, data: { label: 'System Trigger: USER_CREATED' } }
];
const initialEdges = [];

const WorkflowDesigner = () => {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [workflow, setWorkflow] = useState({
        name: 'New Workflow',
        code: 'NEW_WORKFLOW',
        description: '',
        trigger: { source: 'SYSTEM', event: 'USER_CREATED', conditions: [] },
        status: 'draft'
    });

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        if (!isNew) {
            loadWorkflow();
        }
    }, [id]);

    const loadWorkflow = async () => {
        try {
            const res = await getWorkflowById(id);
            const wf = res.data.data;
            setWorkflow(wf);
            
            // Map DB nodes to React Flow
            if (wf.nodes && wf.nodes.length > 0) {
                const rfNodes = [];
                const rfEdges = [];
                
                wf.nodes.forEach((n, idx) => {
                    rfNodes.push({
                        id: n.id,
                        type: n.type === 'trigger' ? 'input' : 'default',
                        position: { x: 250, y: 50 + (idx * 150) }, // Auto layout roughly
                        data: { label: n.name }
                    });

                    if (n.nextNodes && n.nextNodes.length > 0) {
                        n.nextNodes.forEach(nextId => {
                            rfEdges.push({
                                id: `e-${n.id}-${nextId}`,
                                source: n.id,
                                target: nextId
                            });
                        });
                    }
                });
                
                setNodes(rfNodes);
                setEdges(rfEdges);
            }
        } catch (error) {
            toast.error("Failed to load workflow");
        } finally {
            setLoading(false);
        }
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const addActionNode = () => {
        const newNodeId = `action_${Date.now()}`;
        const newNode = {
            id: newNodeId,
            position: { x: 250, y: nodes.length * 150 + 50 },
            data: { label: 'New HTTP Action' },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Map React Flow back to DB Nodes
            const dbNodes = nodes.map(n => {
                const nextNodes = edges.filter(e => e.source === n.id).map(e => e.target);
                return {
                    id: n.id,
                    type: n.id.startsWith('trigger') ? 'trigger' : 'action',
                    name: n.data.label,
                    nextNodes,
                    config: n.id.startsWith('trigger') ? {} : { actionType: 'HTTP_REQUEST', url: 'https://webhook.site/test' }
                };
            });

            const payload = {
                ...workflow,
                nodes: dbNodes
            };

            if (isNew) {
                const res = await createWorkflow(payload);
                toast.success("Workflow created!");
                navigate(`/workflows/${res.data.data._id}/edit`, { replace: true });
            } else {
                await updateWorkflow(id, payload);
                toast.success("Workflow updated!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save workflow");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/workflows')} className="text-slate-500 hover:text-blue-600">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <input 
                            type="text" 
                            className="text-lg font-bold text-slate-900 border-none outline-none hover:bg-slate-50 focus:bg-white rounded px-2 py-1 w-64"
                            value={workflow.name}
                            onChange={e => setWorkflow({...workflow, name: e.target.value})}
                        />
                        <div className="flex items-center text-xs text-slate-500 px-2 mt-1 space-x-2">
                            <span>Code:</span>
                            <input 
                                type="text"
                                className="border-none outline-none uppercase w-32"
                                value={workflow.code}
                                onChange={e => setWorkflow({...workflow, code: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <select 
                        value={workflow.status}
                        onChange={e => setWorkflow({...workflow, status: e.target.value})}
                        className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    <button 
                        onClick={addActionNode}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                    >
                        + Add Action Node
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? <LoadingSpinner size="small" /> : <FaSave className="mr-2" />}
                        Save Workflow
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-50 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
};

export default WorkflowDesigner;
