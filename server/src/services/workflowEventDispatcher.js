const EventEmitter = require('events');
const WorkflowDefinition = require('../models/WorkflowDefinition');
const WorkflowExecution = require('../models/WorkflowExecution');
const workflowExecutionEngine = require('./workflowExecutionEngine');

class WorkflowEventDispatcher extends EventEmitter {
    constructor() {
        super();
        this.on('event', this.handleEvent.bind(this));
    }

    /**
     * Publish an event to the workflow system
     * @param {string} tenantId 
     * @param {string} source - 'SYSTEM' or 'marketplaceAppId'
     * @param {string} eventType - e.g. 'USER_CREATED'
     * @param {Object} payload - The event data
     */
    publish(tenantId, source, eventType, payload) {
        // Emit to internal queue to prevent blocking the main thread immediately
        this.emit('event', { tenantId, source, eventType, payload });
    }

    async handleEvent({ tenantId, source, eventType, payload }) {
        try {
            // Find active workflows matching this trigger
            const workflows = await WorkflowDefinition.find({
                tenantId,
                'trigger.source': source,
                'trigger.event': eventType,
                status: 'active'
            });

            for (const workflow of workflows) {
                // Check conditions if any
                if (this.evaluateConditions(workflow.trigger.conditions, payload)) {
                    await this.spawnExecution(tenantId, workflow, payload);
                }
            }
        } catch (error) {
            console.error('WorkflowEventDispatcher Error:', error);
        }
    }

    evaluateConditions(conditions, payload) {
        if (!conditions || conditions.length === 0) return true;

        for (const condition of conditions) {
            const fieldValue = this.getNestedValue(payload, condition.field);
            
            switch (condition.operator) {
                case 'equals':
                    if (fieldValue !== condition.value) return false;
                    break;
                case 'not_equals':
                    if (fieldValue === condition.value) return false;
                    break;
                case 'contains':
                    if (!fieldValue || !String(fieldValue).includes(String(condition.value))) return false;
                    break;
                case 'exists':
                    if (fieldValue === undefined || fieldValue === null) return false;
                    break;
                default:
                    return false;
            }
        }
        return true;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    async spawnExecution(tenantId, workflow, payload) {
        try {
            const execution = new WorkflowExecution({
                tenantId,
                workflowId: workflow._id,
                triggerEventPayload: payload,
                status: 'pending'
            });
            await execution.save();

            // Kick off the execution asynchronously
            setImmediate(() => {
                workflowExecutionEngine.execute(execution._id);
            });
        } catch (error) {
            console.error(`Failed to spawn execution for workflow ${workflow._id}:`, error);
        }
    }
}

// Export a singleton instance
const dispatcher = new WorkflowEventDispatcher();
module.exports = dispatcher;
