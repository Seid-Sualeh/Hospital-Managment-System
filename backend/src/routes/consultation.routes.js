const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultation.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

// Require authentication for all routes
router.use(authenticateUser);

router.post(
  "/",
  requireRole(1, 2),
  requirePermission("CREATE_RECORD"),
  consultationController.create,
);
router.get(
  "/patient/:patientId",
  requireRole(1, 2, 3),
  requirePermission("READ_RECORD"),
  consultationController.listByPatient,
);
router.get(
  "/:id",
  requireRole(1, 2, 3),
  requirePermission("READ_RECORD"),
  consultationController.getById,
);

module.exports = router;
