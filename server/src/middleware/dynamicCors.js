const cors = require("cors");
const Application = require("../models/Application");

class CorsManager {
    constructor() {
        this.allowedOrigins = new Set();
        this.baseOrigins = ["http://localhost:5011", "http://localhost:5176"];

        // Add base origins
        this.baseOrigins.forEach(origin => this.allowedOrigins.add(origin));

        // Load dynamically initially
        this.refreshOrigins().catch(err => console.error("Failed to load CORS origins:", err));
    }

    async refreshOrigins() {
        try {
            const applications = await Application.find({ status: "active" }, { allowedOrigins: 1, frontendUrl: 1 });

            // Rebuild the set to drop deleted applications
            const newOrigins = new Set(this.baseOrigins);

            for (const app of applications) {
                if (app.frontendUrl) {
                    newOrigins.add(app.frontendUrl);
                }
                if (app.allowedOrigins && app.allowedOrigins.length > 0) {
                    app.allowedOrigins.forEach(origin => newOrigins.add(origin));
                }
            }

            this.allowedOrigins = newOrigins;
            console.log("CORS origins refreshed. Allowed count:", this.allowedOrigins.size);
        } catch (error) {
            console.error("Error refreshing CORS origins:", error);
        }
    }

    getMiddleware() {
        return cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true);

                // Allow any localhost port for development ease
                if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                    return callback(null, true);
                }

                if (this.allowedOrigins.has(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS origin not allowed: ${origin}`));
                }
            },
            credentials: true,
        });
    }
}

const corsManager = new CorsManager();
module.exports = corsManager;
