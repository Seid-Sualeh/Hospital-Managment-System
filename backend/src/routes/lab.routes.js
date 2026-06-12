const express = require("express");
const router = express.Router();
const labController = require("../controllers/lab.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

router.get(
  "/requests",
  requireRole(1, 2, 3),
  requirePermission("READ_PATIENT"),
  labController.listRequests,
);
router.put(
  "/requests/:id/collect",
  requireRole(1, 2, 3),
  requirePermission("READ_PATIENT"),
  labController.collectSample,
);
router.post(
  "/requests/:id/results",
  requireRole(1, 2, 3),
  requirePermission("READ_PATIENT"),
  labController.enterResults,
);
router.put(
  "/requests/:id/approve",
  requireRole(1, 2, 3),
  requirePermission("READ_PATIENT"),
  labController.approveResults,
);
router.get(
  "/requests/:id/report",
  requireRole(1, 2, 3),
  requirePermission("READ_PATIENT"),
  labController.getResultsReport,
);

module.exports = router;
