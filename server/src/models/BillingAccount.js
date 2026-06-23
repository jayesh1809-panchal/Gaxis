const mongoose = require('mongoose');

const billingAccountSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true,
        index: true
    },
    billingEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        trim: true
    },
    paymentMethodDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    balance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('BillingAccount', billingAccountSchema);
