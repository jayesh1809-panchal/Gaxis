import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts & Routing
import MainLayout from "./layouts/MainLayout";
import Workspace from "./pages/os/Workspace";
import EcosystemCommandCenter from "./pages/os/EcosystemCommandCenter";
import UnifiedSettings from "./pages/os/UnifiedSettings";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ROUTES } from "./routes/constants";

// Pages
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationDetails from "./pages/ApplicationDetails";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Sessions from "./pages/Sessions";
import Security from "./pages/Security";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Tenants from "./pages/Tenants";
import MarketplacePage from "./pages/MarketplacePage";
import MarketplaceApplicationDetails from "./pages/MarketplaceApplicationDetails";
import ApplicationSubscriptionPage from "./pages/ApplicationSubscriptionPage";
import WorkflowDashboard from "./pages/WorkflowDashboard";
import WorkflowDesigner from "./pages/WorkflowDesigner";
import WorkflowExecutionDetails from "./pages/WorkflowExecutionDetails";
import EventDashboard from "./pages/EventDashboard";
import EventDeliveryMonitor from "./pages/EventDeliveryMonitor";
import EventDeadLetterQueue from "./pages/EventDeadLetterQueue";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import TenantBillingDashboard from "./pages/TenantBillingDashboard";
import PublisherRevenueDashboard from "./pages/PublisherRevenueDashboard";
import SuperAdminRevenueDashboard from "./pages/SuperAdminRevenueDashboard";
import OrganizationExplorer from "./pages/OrganizationExplorer";
import ApprovalCenter from "./pages/ApprovalCenter";
import PolicyCenter from "./pages/PolicyCenter";
import DelegatedAdminCenter from "./pages/DelegatedAdminCenter";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import AICopilotDashboard from "./pages/copilot/AICopilotDashboard";
import InfrastructureDashboard from "./pages/infrastructure/InfrastructureDashboard";
import ServiceHealthDashboard from "./pages/infrastructure/ServiceHealthDashboard";
import DisasterRecoveryCenter from "./pages/infrastructure/DisasterRecoveryCenter";
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import APICatalog from './pages/developer/APICatalog';
import APIExplorer from './pages/developer/APIExplorer';
import WebhookExplorer from './pages/developer/WebhookExplorer';
import ApplicationRegistration from './pages/developer/ApplicationRegistration';
import SDKCatalog from './pages/developer/SDKCatalog';

import APIDiscoveryHub from './pages/api-marketplace/APIDiscoveryHub';
import APIProductDetails from './pages/api-marketplace/APIProductDetails';
import ProviderDashboard from './pages/api-marketplace/ProviderDashboard';
import ConsumerDashboard from './pages/api-marketplace/ConsumerDashboard';

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          
          {/* Protected Main Layout Routes */}
          <Route element={<ProtectedRoute><Workspace><Outlet /></Workspace></ProtectedRoute>}>
            {/* OS Level Routes (No Sidebar) */}
            <Route path="/os/command-center" element={<EcosystemCommandCenter />} />
            <Route path="/os/settings" element={<UnifiedSettings />} />

            {/* Application Level Routes (With Sidebar) */}
            <Route element={<MainLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.APPLICATIONS} element={<Applications />} />
            <Route path={ROUTES.APPLICATION_DETAILS} element={<ApplicationDetails />} />
            <Route path={ROUTES.USERS} element={<Users />} />
            <Route path={ROUTES.ROLES} element={<Roles />} />
            <Route path={ROUTES.PERMISSIONS} element={<Permissions />} />
            <Route path={ROUTES.SESSIONS} element={<Sessions />} />
            <Route path={ROUTES.SECURITY} element={<Security />} />
            <Route path={ROUTES.MARKETPLACE} element={<MarketplacePage />} />
            <Route path={ROUTES.MARKETPLACE_DETAILS} element={<MarketplaceApplicationDetails />} />
            <Route path={ROUTES.SUBSCRIPTIONS} element={<ApplicationSubscriptionPage />} />
            
            {/* Workflow Routes */}
            <Route path={ROUTES.WORKFLOWS} element={<ProtectedRoute><WorkflowDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.WORKFLOW_DESIGNER} element={<ProtectedRoute><WorkflowDesigner /></ProtectedRoute>} />
            <Route path={ROUTES.WORKFLOW_NEW} element={<ProtectedRoute><WorkflowDesigner /></ProtectedRoute>} />
            <Route path={ROUTES.WORKFLOW_EXECUTIONS} element={<ProtectedRoute><WorkflowExecutionDetails /></ProtectedRoute>} />
            
            {/* Event Bus Routes */}
            <Route path={ROUTES.EVENT_BUS} element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.EVENT_DELIVERIES} element={<ProtectedRoute><EventDeliveryMonitor /></ProtectedRoute>} />
            <Route path={ROUTES.EVENT_DLQ} element={<ProtectedRoute><EventDeadLetterQueue /></ProtectedRoute>} />

            {/* Analytics Route */}
            <Route path={ROUTES.ANALYTICS} element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />

            {/* Billing & Revenue Routes */}
            <Route path={ROUTES.BILLING} element={<ProtectedRoute><TenantBillingDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.REVENUE_PUBLISHER} element={<ProtectedRoute><PublisherRevenueDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.REVENUE_ADMIN} element={<ProtectedRoute requiredRole="SUPER_ADMIN"><SuperAdminRevenueDashboard /></ProtectedRoute>} />
            
            {/* Governance Routes */}
            <Route path={ROUTES.GOVERNANCE_EXPLORER} element={<ProtectedRoute><OrganizationExplorer /></ProtectedRoute>} />
            <Route path={ROUTES.GOVERNANCE_APPROVALS} element={<ProtectedRoute><ApprovalCenter /></ProtectedRoute>} />
            <Route path={ROUTES.GOVERNANCE_POLICIES} element={<ProtectedRoute><PolicyCenter /></ProtectedRoute>} />
            <Route path={ROUTES.GOVERNANCE_DELEGATED} element={<ProtectedRoute><DelegatedAdminCenter /></ProtectedRoute>} />
            <Route path={ROUTES.GOVERNANCE_COMPLIANCE} element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
            
            {/* AI Copilot Route */}
            <Route path={ROUTES.AI_COPILOT} element={<ProtectedRoute><AICopilotDashboard /></ProtectedRoute>} />
            
            {/* Infrastructure Routes */}
            <Route path="/infrastructure/regions" element={<ProtectedRoute requiredRole="SYSTEM_ADMIN"><InfrastructureDashboard /></ProtectedRoute>} />
            <Route path="/infrastructure/health" element={<ProtectedRoute requiredRole="SYSTEM_ADMIN"><ServiceHealthDashboard /></ProtectedRoute>} />
            <Route path="/infrastructure/dr" element={<ProtectedRoute requiredRole="SYSTEM_ADMIN"><DisasterRecoveryCenter /></ProtectedRoute>} />
            
            {/* Developer Routes */}
            <Route path="/developer" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />
            <Route path="/developer/catalog" element={<ProtectedRoute><APICatalog /></ProtectedRoute>} />
            <Route path="/developer/explorer" element={<ProtectedRoute><APIExplorer /></ProtectedRoute>} />
            <Route path="/developer/webhooks" element={<ProtectedRoute><WebhookExplorer /></ProtectedRoute>} />
            <Route path="/developer/apps" element={<ProtectedRoute><ApplicationRegistration /></ProtectedRoute>} />
            <Route path="/developer/sdks" element={<ProtectedRoute><SDKCatalog /></ProtectedRoute>} />
            
            {/* API Marketplace Routes */}
            <Route path="/api-marketplace/discover" element={<ProtectedRoute><APIDiscoveryHub /></ProtectedRoute>} />
            <Route path="/api-marketplace/product/:id" element={<ProtectedRoute><APIProductDetails /></ProtectedRoute>} />
            <Route path="/api-marketplace/provider" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
            <Route path="/api-marketplace/consumer" element={<ProtectedRoute><ConsumerDashboard /></ProtectedRoute>} />

            <Route path={ROUTES.AUDIT_LOGS} element={<ProtectedRoute requiredPermission="audit_logs.read"><AuditLogs /></ProtectedRoute>} />
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
            <Route path={ROUTES.TENANTS} element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Tenants /></ProtectedRoute>} />
            </Route>
          </Route>

          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;