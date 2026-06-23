const express = require("express");
const {
    getUserRoles,
    assignRoles,
    updateUserRole,
    removeUserRole
} = require("../controllers/userRoleController");

// mergeParams: true is required to access the :userId param from the parent router (userRoutes)
const router = express.Router({ mergeParams: true });

router
    .route("/")
    .get(getUserRoles)
    .post(assignRoles);

router
    .route("/:roleId")
    .put(updateUserRole)
    .delete(removeUserRole);

module.exports = router;
