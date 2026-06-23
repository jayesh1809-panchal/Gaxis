const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Conversation" },
    messages: [{
        sender: { type: String, enum: ["user", "assistant"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        suggestedActions: [{ type: mongoose.Schema.Types.ObjectId, ref: "AIAction" }]
    }]
}, { timestamps: true });

module.exports = mongoose.model("AIConversation", aiConversationSchema);
