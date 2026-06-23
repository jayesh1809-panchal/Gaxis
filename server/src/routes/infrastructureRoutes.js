const express = require("express");
const router = express.Router();
const infrastructureController = require("../controllers/infrastructureController");
const { protect } = require("../middleware/auth");

// Protect all routes
router.use(protect);

router.route("/regions")
    .get(infrastructureController.getRegions)
    .post(infrastructureController.createRegion);

router.route("/clusters")
    .get(infrastructureController.getClusters)
    .post(infrastructureController.createCluster);

router.post("/failover", infrastructureController.triggerFailover);

router.route("/backups")
    .get(infrastructureController.getBackups)
    .post(infrastructureController.createBackup);

router.post("/recovery/drill", infrastructureController.executeDrill);

module.exports = router;
