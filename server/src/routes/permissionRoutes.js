const express = require("express");
const {
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    updatePermissionStatus,
    deletePermission
} = require("../controllers/permissionController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router
    .route("/")
    .get(authorize("permissions.read"), getPermissions)
    .post(authorize("permissions.create"), createPermission);

router
    .route("/:id")
    .get(authorize("permissions.read"), getPermission)
    .put(authorize("permissions.update"), updatePermission)
    .delete(authorize("permissions.delete"), deletePermission);

router
    .route("/:id/status")
    .put(authorize("permissions.update"), updatePermissionStatus);

module.exports = router;
