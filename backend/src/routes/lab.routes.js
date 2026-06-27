const express = require("express");
const router = express.Router();
const labController = require("../controllers/lab.controller");
const billingController = require("../controllers/billing.controller");
const {
  authenticateUser,
  requirePermission,
  requireRole,
} = require("../middlewares/auth");

router.use(authenticateUser);

// Lab request workflow
router.get(
  "/requests",
  requireRole(1, 2, 3, 6),
  requirePermission("READ_LAB_REQUEST"),
  labController.listRequests,
);
router.get(
  "/requests/:id",
  requireRole(1, 2, 3, 6),
  requirePermission("READ_LAB_REQUEST"),
  labController.getRequest,
);
router.post(
  "/requests",
  requireRole(1, 2),
  requirePermission("CREATE_RECORD"),
  labController.createRequest,
);
router.put(
  "/requests/:id/collect",
  requireRole(1, 2, 3, 6),
  requirePermission("COLLECT_SAMPLE"),
  labController.collectSample,
);
router.put(
  "/requests/:id/results",
  requireRole(1, 2, 6),
  requirePermission("ENTER_LAB_RESULTS"),
  labController.enterResults,
);
router.put(
  "/requests/:id/result",
  requireRole(1, 2, 6),
  requirePermission("ENTER_LAB_RESULTS"),
  labController.enterResultSimple,
);
router.put(
  "/requests/:id/approve",
  requireRole(1, 2, 3, 6),
  requirePermission("APPROVE_LAB_RESULTS"),
  labController.approveResults,
);
router.get(
  "/requests/:id/report",
  requireRole(1, 2, 3, 6),
  requirePermission("READ_LAB_REQUEST"),
  labController.getResultsReport,
);

// Lab billing (cashier / lab front desk)
router.get(
  "/invoices",
  requireRole(1, 4, 6, 7),
  requirePermission("GENERATE_INVOICE"),
  billingController.listInvoices,
);
router.post(
  "/invoices",
  requireRole(1, 4, 6, 7),
  requirePermission("GENERATE_INVOICE"),
  billingController.createInvoice,
);
router.get(
  "/invoices/:id",
  requireRole(1, 4, 7),
  requirePermission("READ_PATIENT"),
  billingController.getInvoiceById,
);

module.exports = router;
