const mongoose = require("mongoose");

const eventDefinitionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true
    }, // Null if it's a global system event
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    category: {
        type: String,
        default: 'System',
        trim: true
    },
    schemaDetails: {
        type: mongoose.Schema.Types.Mixed, // Optional JSON schema validation map
        default: {}
    }
}, { timestamps: true });

// Ensure unique code per tenant (or globally if tenantId is null)
eventDefinitionSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("EventDefinition", eventDefinitionSchema);
