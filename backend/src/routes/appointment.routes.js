const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");
const appointmentValidation = require("../middlewares/appointment.validation");

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

router.get(
  "/",
  requireRole(1, 2, 4),
  requirePermission("READ_PATIENT"),
  appointmentController.list,
);
router.post(
  "/",
  requireRole(1, 2, 4),
  requirePermission("CREATE_PATIENT"),
  appointmentValidation.validateCreate,
  appointmentController.create,
);
router.put(
  "/:id/reschedule",
  requireRole(1, 2, 4),
  requirePermission("CREATE_PATIENT"),
  appointmentValidation.validateReschedule,
  appointmentController.reschedule,
);
router.put(
  "/:id/status",
  requireRole(1, 2, 4),
  requirePermission("CREATE_PATIENT"),
  appointmentController.updateStatus,
);
router.delete(
  "/:id",
  requireRole(1, 2, 4),
  requirePermission("CREATE_PATIENT"),
  appointmentController.cancel,
);

module.exports = router;
