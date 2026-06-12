const express = require("express");
const router = express.Router();
const pharmacyController = require("../controllers/pharmacy.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

router.get(
  "/catalog",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.listMedicines,
);
router.post(
  "/catalog",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.addMedicine,
);
router.post(
  "/inventory/transaction",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.updateStock,
);
router.post(
  "/inventory/dispense",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.dispenseMedicine,
);

module.exports = router;
