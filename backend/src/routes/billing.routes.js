const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billing.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

// Public webhook route (does not require standard JWT headers - verified via HMAC signature)
router.post("/payments/webhook", billingController.paymentWebhook);

// Protected routes (require JWT user sessions)
router.get(
  "/invoices",
  authenticateUser,
  requireRole(1, 4),
  requirePermission("GENERATE_INVOICE"),
  billingController.listInvoices,
);
router.post(
  "/invoices",
  authenticateUser,
  requireRole(1, 4),
  requirePermission("GENERATE_INVOICE"),
  billingController.createInvoice,
);
router.get(
  "/invoices/:id",
  authenticateUser,
  requireRole(1, 4),
  requirePermission("READ_PATIENT"),
  billingController.getInvoiceById,
);
router.post(
  "/payments/initiate",
  authenticateUser,
  requireRole(1, 4),
  requirePermission("COLLECT_PAYMENT"),
  billingController.initiatePayment,
);
router.get(
  "/patients/:patientId/unbilled",
  authenticateUser,
  requireRole(1, 4),
  requirePermission("GENERATE_INVOICE"),
  billingController.getUnbilledItems,
);

module.exports = router;
