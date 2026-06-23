const crypto = require('crypto');

/**
 * Abstract Payment Provider Class
 * Defines the contract that all concrete gateway adapters must implement.
 */
class PaymentProvider {
    async createCustomer(tenantId, billingEmail) {
        throw new Error("Method 'createCustomer' must be implemented");
    }

    async createPaymentIntent(amount, currency, metadata) {
        throw new Error("Method 'createPaymentIntent' must be implemented");
    }

    async processPayment(paymentDetails) {
        throw new Error("Method 'processPayment' must be implemented");
    }

    async refundPayment(paymentReference, amount) {
        throw new Error("Method 'refundPayment' must be implemented");
    }
}

/**
 * Mock Gateway Adapter for G-Axis Platform V2
 * Simulates Stripe/Razorpay credit card charges and tokenizations.
 */
class MockPaymentAdapter extends PaymentProvider {
    async createCustomer(tenantId, billingEmail) {
        // Return a mock customer reference
        return `mock_cust_${crypto.randomBytes(8).toString('hex')}`;
    }

    async createPaymentIntent(amount, currency, metadata) {
        // Return a mock secret / intent reference
        return {
            intentId: `mock_pi_${crypto.randomBytes(12).toString('hex')}`,
            clientSecret: `mock_secret_${crypto.randomBytes(24).toString('hex')}`,
            amount,
            currency,
            status: 'requires_payment_method'
        };
    }

    async processPayment({ amount, currency, source }) {
        // Simulate card processing logic
        // If source is 'fail_card', simulate payment failure
        if (source === 'fail_card') {
            return {
                success: false,
                status: 'failed',
                error: 'Card declined: Insufficient funds',
                reference: `mock_txn_err_${crypto.randomBytes(10).toString('hex')}`
            };
        }

        return {
            success: true,
            status: 'completed',
            reference: `mock_txn_ref_${crypto.randomBytes(12).toString('hex')}`,
            amount,
            currency,
            paidDate: new Date()
        };
    }

    async refundPayment(paymentReference, amount) {
        return {
            success: true,
            status: 'refunded',
            refundReference: `mock_ref_ref_${crypto.randomBytes(12).toString('hex')}`,
            amount
        };
    }
}

// Registry to manage multiple adapters
const providers = {};

function registerProvider(name, providerInstance) {
    providers[name] = providerInstance;
}

function getProvider(name = 'mock') {
    const provider = providers[name];
    if (!provider) {
        throw new Error(`Payment provider '${name}' is not registered`);
    }
    return provider;
}

// Register default mock provider
registerProvider('mock', new MockPaymentAdapter());

module.exports = {
    PaymentProvider,
    MockPaymentAdapter,
    registerProvider,
    getProvider
};
