const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Symmetrical encryption for the TOTP secret
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || "a".repeat(32); // 32 chars
const IV_LENGTH = 16;

const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (text) => {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

const mfaSettingsSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
            },
        secret: {
            type: String, // Encrypted base32 TOTP secret
            required: true,
        },
        backupCodes: {
            type: [String], // Array of hashed backup codes
            default: [],
        },
        isEnabled: {
            type: Boolean,
            default: false,
        },
        enabledAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Method to get decrypted secret
mfaSettingsSchema.methods.getDecryptedSecret = function () {
    return decrypt(this.secret);
};

// Method to set encrypted secret
mfaSettingsSchema.methods.setEncryptedSecret = function (rawSecret) {
    this.secret = encrypt(rawSecret);
};

// Method to check backup code
mfaSettingsSchema.methods.matchBackupCode = async function (rawCode) {
    for (let i = 0; i < this.backupCodes.length; i++) {
        const isMatch = await bcrypt.compare(rawCode, this.backupCodes[i]);
        if (isMatch) {
            // Return the matching hash so it can be removed
            return this.backupCodes[i];
        }
    }
    return null;
};

// Helper to hash and set backup codes
mfaSettingsSchema.methods.setBackupCodes = async function (rawCodes) {
    const hashedCodes = await Promise.all(
        rawCodes.map(async (code) => {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(code, salt);
        })
    );
    this.backupCodes = hashedCodes;
};


mfaSettingsSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("MfaSettings", mfaSettingsSchema);
