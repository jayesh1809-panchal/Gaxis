const mongoose = require("mongoose");

const developerOrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    website: String,
    billingEmail: String,
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeveloperAccount",
        required: true
    },
    members: [{
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeveloperAccount"
        },
        role: {
            type: String,
            enum: ["admin", "developer", "viewer"]
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("DeveloperOrganization", developerOrganizationSchema);
