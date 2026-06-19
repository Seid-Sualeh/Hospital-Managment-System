const express = require("express");
const router = express.Router();
const pharmacyController = require("../controllers/pharmacy.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

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

router.get(
  "/medicines",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.listMedicines,
);
router.post(
  "/medicines",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.addMedicine,
);
router.put(
  "/medicines/:id",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.updateMedicine,
);
router.delete(
  "/medicines/:id",
  requireRole(1, 5),
  requirePermission("MANAGE_STOCK"),
  pharmacyController.deactivateMedicine,
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
  requirePermission("DISPENSE_MEDICINE"),
  pharmacyController.dispenseMedicine,
);
router.post(
  "/dispense",
  requireRole(1, 5),
  requirePermission("DISPENSE_MEDICINE"),
  pharmacyController.dispenseFromUI,
);

module.exports = router;
