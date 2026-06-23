const express = require("express");
const {
    getUserApplications,
    assignApplication,
    updateApplicationAccess,
    removeApplicationAccess
} = require("../controllers/userAccessController");

// mergeParams is required to access the :id param from the parent router (userRoutes)
const router = express.Router({ mergeParams: true });

router
    .route("/")
    .get(getUserApplications)
    .post(assignApplication);

router
    .route("/:appId")
    .put(updateApplicationAccess)
    .delete(removeApplicationAccess);

module.exports = router;
