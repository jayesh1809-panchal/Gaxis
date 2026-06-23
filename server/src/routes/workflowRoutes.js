const express = require("express");
const workflowController = require("../controllers/workflowController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(workflowController.getWorkflows)
    .post(workflowController.createWorkflow);

router.route("/events")
    .post(workflowController.emitExternalEvent);

router.route("/executions")
    .get(workflowController.getExecutions);

router.route("/executions/:id")
    .get(workflowController.getExecutionById);

router.route("/:id")
    .get(workflowController.getWorkflowById)
    .put(workflowController.updateWorkflow)
    .delete(workflowController.deleteWorkflow);

module.exports = router;
