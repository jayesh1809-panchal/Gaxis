const express = require("express");
const {
    createUser,
    getUsers,
    getUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    getEffectivePermissions
} = require("../controllers/userController");

const { getUserSessions, revokeUserSessions } = require("../controllers/sessionController");

// Import the user access routes for nesting
const userAccessRoutes = require("./userAccessRoutes");
const userRoleRoutes = require("./userRoleRoutes");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Mount user access routes at /api/users/:id/applications
router.use("/:id/applications", userAccessRoutes);

// Mount user role routes at /api/users/:id/roles
router.use("/:userId/roles", userRoleRoutes);

router
    .route("/")
    .get(authorize("users.read"), getUsers)
    .post(authorize("users.create"), createUser);

router
    .route("/:id")
    .get(authorize("users.read"), getUser)
    .put(authorize("users.update"), updateUser)
    .delete(authorize("users.delete"), deleteUser);

router
    .route("/:id/status")
    .put(authorize("users.update"), updateUserStatus);

router
    .route("/:id/effective-permissions")
    .get(authorize("users.read"), getEffectivePermissions);

router
    .route("/:id/sessions")
    .get(authorize("sessions.read"), getUserSessions)
    .delete(authorize("sessions.delete"), revokeUserSessions);

module.exports = router;
