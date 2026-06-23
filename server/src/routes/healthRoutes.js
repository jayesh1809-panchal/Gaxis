const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Liveness Probe: Verifies the Node.js process is responsive
router.get('/live', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Readiness Probe: Verifies external dependencies (e.g., MongoDB)
router.get('/ready', async (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        res.status(200).json({ status: 'Ready', database: 'Connected' });
    } else {
        res.status(503).json({ status: 'Not Ready', database: 'Disconnected' });
    }
});

// Full Health Summary
router.get('/health', async (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    
    const healthData = {
        uptime: process.uptime(),
        timestamp: new Date(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        database: {
            status: isDbConnected ? 'Connected' : 'Disconnected',
            state: mongoose.connection.readyState
        }
    };
    
    if (isDbConnected) {
        res.status(200).json(healthData);
    } else {
        res.status(503).json(healthData);
    }
});

module.exports = router;
