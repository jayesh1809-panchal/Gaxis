const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    marketplaceAppId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MarketplaceApplication',
        index: true
    },
    billingPeriod: {
        type: String, // e.g. "2026-06"
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'unpaid', 'paid', 'void', 'past_due'],
        default: 'draft',
        index: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    issuedDate: {
        type: Date
    },
    lineItems: [{
        description: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
