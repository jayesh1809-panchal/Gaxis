const express = require("express");
const router = express.Router();
const ecosystemController = require("../controllers/ecosystemController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/workspace", ecosystemController.getWorkspace);
router.post("/workspace/pin", ecosystemController.togglePin);

router.get("/context", ecosystemController.getContext);
router.post("/context", ecosystemController.updateContext);

module.exports = router;
