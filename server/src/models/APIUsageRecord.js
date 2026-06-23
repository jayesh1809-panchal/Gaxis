const mongoose = require("mongoose");

const apiUsageRecordSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperApplication"
    },
    endpoint: String,
    method: String,
    statusCode: Number,
    latencyMs: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false,
    timeseries: {
        timeField: 'timestamp',
        metaField: 'applicationId',
        granularity: 'seconds'
    }
});

module.exports = mongoose.model("APIUsageRecord", apiUsageRecordSchema);
