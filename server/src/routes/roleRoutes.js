const express = require("express");
const {
    createRole,
    getRoles,
    getRole,
    updateRole,
    updateRoleStatus,
    deleteRole
} = require("../controllers/roleController");

const rolePermissionRoutes = require("./rolePermissionRoutes");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Mount role permission routes at /api/roles/:id/permissions
router.use("/:id/permissions", rolePermissionRoutes);

router
    .route("/")
    .get(authorize("roles.read"), getRoles)
    .post(authorize("roles.create"), createRole);

router
    .route("/:id")
    .get(authorize("roles.read"), getRole)
    .put(authorize("roles.update"), updateRole)
    .delete(authorize("roles.delete"), deleteRole);

router
    .route("/:id/status")
    .put(authorize("roles.update"), updateRoleStatus);

module.exports = router;
