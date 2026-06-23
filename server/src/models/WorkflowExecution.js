const mongoose = require("mongoose");

const nodeExecutionSchema = new mongoose.Schema({
    nodeId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'pending' },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    output: { type: mongoose.Schema.Types.Mixed },
    error: { type: String }
}, { _id: false });

const workflowExecutionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkflowDefinition',
        required: true,
        index: true
    },
    triggerEventPayload: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'success', 'failed', 'retrying'],
        default: 'pending'
    },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    durationMs: { type: Number },
    nodeExecutions: [nodeExecutionSchema],
    errorLogs: [{
        timestamp: { type: Date, default: Date.now },
        message: String,
        stack: String
    }]
}, { timestamps: true });

module.exports = mongoose.model("WorkflowExecution", workflowExecutionSchema);
