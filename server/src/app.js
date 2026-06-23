const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");

// Routes
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const mfaRoutes = require("./routes/mfaRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const wellKnownRoutes = require("./routes/wellKnownRoutes");
const auditRoutes = require("./routes/auditRoutes");
const healthRoutes = require("./routes/healthRoutes");
const provisioningRoutes = require("./routes/provisioningRoutes");
const securityRoutes = require("./routes/securityRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const marketplaceAdminRoutes = require("./routes/marketplaceAdminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const subscriptionAdminRoutes = require("./routes/subscriptionAdminRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const eventBusRoutes = require("./routes/eventBusRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const billingRoutes = require("./routes/billingRoutes");
const licensingRoutes = require("./routes/licensingRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const governanceRoutes = require("./routes/governanceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const infrastructureRoutes = require("./routes/infrastructureRoutes");
const developerRoutes = require("./routes/developerRoutes");
const apiGatewayRoutes = require("./routes/apiGatewayRoutes");
const apiMarketplaceRoutes = require("./routes/apiMarketplaceRoutes");
const apiProviderRoutes = require("./routes/apiProviderRoutes");
const ecosystemRoutes = require("./routes/ecosystemRoutes");
const searchRoutes = require("./routes/searchRoutes");

const errorHandler = require("./middleware/errorHandler");
const tenantMiddleware = require("./middleware/tenantMiddleware");

const app = express();

// =====================================
// Security Middleware
// =====================================
// =====================================
app.use(helmet());
app.use(compression());

// =====================================
// CORS Configuration
// =====================================
const corsManager = require("./middleware/dynamicCors");
app.use(corsManager.getMiddleware());

// =====================================
// Body Parser
// =====================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// Cookie Parser
// =====================================
app.use(cookieParser());

// =====================================
// Health Check Routes
// =====================================
app.use("/", healthRoutes);

// =====================================
// API Routes
// =====================================
app.use("/api", tenantMiddleware);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/provision", provisioningRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/admin/marketplace", marketplaceAdminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin/subscriptions", subscriptionAdminRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/event-bus", eventBusRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/licensing", licensingRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/governance", governanceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/infrastructure", infrastructureRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/gateway", apiGatewayRoutes);
app.use("/api/api-marketplace", apiMarketplaceRoutes);
app.use("/api/api-provider", apiProviderRoutes);
app.use("/api/os", ecosystemRoutes);
app.use("/api/search", searchRoutes);
app.use("/.well-known", wellKnownRoutes);
app.use("/api/audit-logs", auditRoutes);

// =====================================
// Serve Frontend (dist)
// =====================================
const path = require("path");
const distPath = path.join(__dirname, "../../client/dist");
app.use(express.static(distPath));

app.use((req, res, next) => {
    // Exclude API routes from being caught by the React index.html handler
    if (req.method === 'GET' && !req.path.startsWith("/api") && !req.path.startsWith("/.well-known")) {
        return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
});

// =====================================
// 404 Handler (Only for APIs now)
// =====================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

// =====================================
// Global Error Handler
// =====================================
app.use(errorHandler);

module.exports = app;