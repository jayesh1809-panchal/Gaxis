import {
    FaHome,
    FaThLarge,
    FaUsers,
    FaUserTag,
    FaKey,
    FaHistory,
    FaStore,
    FaProjectDiagram,
    FaNetworkWired,
    FaChartLine,
    FaFileInvoiceDollar,
    FaMoneyBillWave,
    FaSitemap,
    FaClipboardCheck,
    FaShieldAlt,
    FaUserTie,
    FaRobot,
    FaBuilding
} from "react-icons/fa";
import { ROUTES } from "./constants";

export const NAVIGATION_CONFIG = [
    {
        name: "Dashboard",
        path: ROUTES.DASHBOARD,
        icon: FaHome,
        requiredPermission: null
    },
    {
        name: "Applications",
        path: ROUTES.APPLICATIONS,
        icon: FaThLarge,
        requiredPermission: null
    },
    {
        name: "Marketplace",
        path: ROUTES.MARKETPLACE,
        icon: FaStore,
        requiredPermission: null
    },
    {
        name: "Workflows",
        path: ROUTES.WORKFLOWS,
        icon: FaProjectDiagram,
        requiredPermission: null
    },
    {
        name: "Event Bus",
        path: ROUTES.EVENT_BUS,
        icon: FaNetworkWired,
        requiredPermission: null
    },
    {
        name: "Analytics",
        path: ROUTES.ANALYTICS,
        icon: FaChartLine,
        requiredPermission: null
    },
    {
        name: "Billing",
        path: ROUTES.BILLING,
        icon: FaFileInvoiceDollar,
        requiredPermission: null
    },
    {
        name: "$ App Revenue",
        path: ROUTES.REVENUE_PUBLISHER,
        icon: FaMoneyBillWave,
        requiredPermission: null
    },
    {
        name: "Organization",
        path: ROUTES.GOVERNANCE_EXPLORER,
        icon: FaSitemap,
        requiredPermission: null
    },
    {
        name: "Compliance",
        path: ROUTES.GOVERNANCE_COMPLIANCE,
        icon: FaClipboardCheck,
        requiredPermission: null
    },
    {
        name: "Policies",
        path: ROUTES.GOVERNANCE_POLICIES,
        icon: FaShieldAlt,
        requiredPermission: null
    },
    {
        name: "Delegated Admin",
        path: ROUTES.GOVERNANCE_DELEGATED,
        icon: FaUserTie,
        requiredPermission: null
    },
    {
        name: "AI Copilot",
        path: ROUTES.AI_COPILOT,
        icon: FaRobot,
        requiredPermission: null
    },
    {
        name: "Users",
        path: ROUTES.USERS,
        icon: FaUsers,
        requiredPermission: null
    },
    {
        name: "Roles",
        path: ROUTES.ROLES,
        icon: FaUserTag,
        requiredPermission: null
    },
    {
        name: "Permissions",
        path: ROUTES.PERMISSIONS,
        icon: FaKey,
        requiredPermission: null
    },
    {
        name: "Sessions",
        path: ROUTES.SESSIONS,
        icon: FaHistory,
        requiredPermission: null
    },
    {
        name: "Tenants",
        path: ROUTES.TENANTS,
        icon: FaBuilding,
        requiredRole: null
    }
];
