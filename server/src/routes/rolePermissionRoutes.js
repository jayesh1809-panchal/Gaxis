const express = require("express");
const {
    getRolePermissions,
    assignPermissions,
    updateRolePermission,
    removeRolePermission
} = require("../controllers/rolePermissionController");

// mergeParams: true is required to access the :id param from the parent router (roleRoutes)
const router = express.Router({ mergeParams: true });

router
    .route("/")
    .get(getRolePermissions)
    .post(assignPermissions);

router
    .route("/:permissionId")
    .put(updateRolePermission)
    .delete(removeRolePermission);

module.exports = router;
