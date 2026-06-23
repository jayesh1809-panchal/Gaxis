const mongoose = require("mongoose");

const ecosystemWorkspaceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
    pinnedApps: [{ type: mongoose.Schema.Types.ObjectId, ref: "EcosystemRegistry" }],
    recentSearches: [{ type: String }],
    preferences: {
        notificationsEnabled: { type: Boolean, default: true },
        autoLaunchCommandCenter: { type: Boolean, default: true },
        defaultView: { type: String, default: "command_center" }
    }
}, { timestamps: true });

module.exports = mongoose.model("EcosystemWorkspace", ecosystemWorkspaceSchema);
