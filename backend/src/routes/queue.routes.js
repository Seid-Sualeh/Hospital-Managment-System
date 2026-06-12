const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queue.controller");
const { authenticateUser, requirePermission } = require("../middlewares/auth");

router.use(authenticateUser);

router.get(
  "/",
  requirePermission("READ_PATIENT"),
  queueController.listAllQueues,
);
router.get(
  "/:type",
  requirePermission("READ_PATIENT"),
  queueController.getQueueByType,
);
router.post(
  "/",
  requirePermission("CREATE_RECORD"),
  queueController.createQueueEntry,
);
router.put(
  "/:id/status",
  requirePermission("CREATE_RECORD"),
  queueController.updateQueueStatus,
);

module.exports = router;
