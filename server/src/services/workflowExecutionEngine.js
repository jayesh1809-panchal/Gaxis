const axios = require('axios');
const WorkflowExecution = require('../models/WorkflowExecution');
const WorkflowDefinition = require('../models/WorkflowDefinition');
const User = require('../models/User'); // Used for actions if needed
// const provisionService = require('./provisioningService'); // Might be needed for specific actions

class WorkflowExecutionEngine {
    
    async execute(executionId) {
        let execution = await WorkflowExecution.findById(executionId).populate('workflowId');
        if (!execution) return;

        if (execution.status !== 'pending' && execution.status !== 'retrying') return;

        execution.status = 'running';
        execution.startedAt = new Date();
        await execution.save();

        const workflow = execution.workflowId;
        const nodes = workflow.nodes;
        
        // Find trigger node
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            return this.failExecution(execution, "No trigger node found in definition");
        }

        // Initialize state Context
        const context = {
            triggerPayload: execution.triggerEventPayload,
            nodeResults: {}
        };

        try {
            await this.traverse(triggerNode, nodes, execution, context);
            
            execution.status = 'success';
            execution.finishedAt = new Date();
            execution.durationMs = execution.finishedAt.getTime() - execution.startedAt.getTime();
            await execution.save();
        } catch (error) {
            await this.failExecution(execution, error.message, error.stack);
        }
    }

    async traverse(currentNode, allNodes, execution, context) {
        // Log start
        const nodeExec = {
            nodeId: currentNode.id,
            status: 'running',
            startedAt: new Date()
        };
        execution.nodeExecutions.push(nodeExec);
        await execution.save();

        let output = null;

        try {
            // Execute node logic based on type/config
            if (currentNode.type === 'action') {
                output = await this.executeAction(currentNode, context);
            } else if (currentNode.type === 'trigger') {
                output = context.triggerPayload;
            } else if (currentNode.type === 'condition') {
                output = this.evaluateConditionNode(currentNode, context);
            } else if (currentNode.type === 'delay') {
                output = await this.executeDelay(currentNode);
            }

            // Log Success
            const idx = execution.nodeExecutions.findIndex(n => n.nodeId === currentNode.id && n.status === 'running');
            if (idx > -1) {
                execution.nodeExecutions[idx].status = 'success';
                execution.nodeExecutions[idx].finishedAt = new Date();
                execution.nodeExecutions[idx].output = output;
            }
            context.nodeResults[currentNode.id] = output;
            await execution.save();

            // Handle branching / next nodes
            let nextNodesToExecute = currentNode.nextNodes || [];

            // If condition, output is a boolean, maybe route based on true/false branch
            if (currentNode.type === 'condition') {
                // simple mapping: assuming nextNodes[0] is true branch, nextNodes[1] is false branch
                // Or maybe config dictates routing. Let's keep it simple: condition node config should define `trueNode` and `falseNode`
                if (output && currentNode.config.trueNode) {
                    nextNodesToExecute = [currentNode.config.trueNode];
                } else if (!output && currentNode.config.falseNode) {
                    nextNodesToExecute = [currentNode.config.falseNode];
                } else {
                    nextNodesToExecute = [];
                }
            }

            for (const nextNodeId of nextNodesToExecute) {
                const nextNode = allNodes.find(n => n.id === nextNodeId);
                if (nextNode) {
                    await this.traverse(nextNode, allNodes, execution, context);
                }
            }

        } catch (error) {
            const idx = execution.nodeExecutions.findIndex(n => n.nodeId === currentNode.id && n.status === 'running');
            if (idx > -1) {
                execution.nodeExecutions[idx].status = 'failed';
                execution.nodeExecutions[idx].finishedAt = new Date();
                execution.nodeExecutions[idx].error = error.message;
            }
            await execution.save();
            throw error; // Propagate up to fail the whole workflow
        }
    }

    async executeAction(node, context) {
        const { actionType, url, method, payloadTemplate } = node.config;

        if (actionType === 'HTTP_REQUEST') {
            // Replace template vars (extremely basic example)
            let finalPayload = { ...payloadTemplate };
            if (finalPayload && typeof finalPayload === 'object') {
                // inject trigger context if needed
                finalPayload._trigger = context.triggerPayload;
            }

            const response = await axios({
                url,
                method: method || 'POST',
                data: finalPayload,
                timeout: 10000
            });
            return response.data;
        } 
        
        // Throw if unknown
        throw new Error(`Unsupported actionType: ${actionType}`);
    }

    evaluateConditionNode(node, context) {
        // Example basic eval
        const { fieldPath, operator, value } = node.config;
        const actualValue = pathGet(context.triggerPayload, fieldPath);
        
        switch (operator) {
            case 'equals': return actualValue === value;
            case 'not_equals': return actualValue !== value;
            // Add more as needed
            default: return false;
        }
    }

    async executeDelay(node) {
        const ms = node.config.delayMs || 1000;
        return new Promise(resolve => setTimeout(() => resolve({ delayedMs: ms }), ms));
    }

    async failExecution(execution, message, stack) {
        execution.status = 'failed';
        execution.finishedAt = new Date();
        execution.errorLogs.push({ message, stack });
        if (execution.startedAt) {
            execution.durationMs = execution.finishedAt.getTime() - execution.startedAt.getTime();
        }
        await execution.save();
    }
}

// Simple helper to get nested prop
function pathGet(obj, path) {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

module.exports = new WorkflowExecutionEngine();
