const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['trigger', 'action', 'condition', 'delay'], required: true },
    name: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    nextNodes: [{ type: String }] // IDs of the nodes to execute after this one
}, { _id: false });

const workflowDefinitionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'disabled'],
        default: 'draft'
    },
    trigger: {
        source: { type: String, required: true }, // e.g., 'SYSTEM', or specific marketplaceAppId
        event: { type: String, required: true }, // e.g., 'USER_CREATED', 'employee.created'
        conditions: [{
            field: String,
            operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'exists'] },
            value: mongoose.Schema.Types.Mixed
        }]
    },
    nodes: [nodeSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure unique code per tenant
workflowDefinitionSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("WorkflowDefinition", workflowDefinitionSchema);
