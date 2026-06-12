const express = require("express");
const router = express.Router();
const visitController = require("../controllers/visit.controller");
const { authenticateUser, requirePermission } = require("../middlewares/auth");

// Require authentication for all routes
router.use(authenticateUser);

/**
 * @route   POST /api/visits
 * @desc    Create a new visit (patient registration)
 * @access  Private
 */
router.post("/", requirePermission("CREATE_PATIENT"), visitController.create);

/**
 * @route   GET /api/visits
 * @desc    List all visits with optional filters
 * @access  Private
 */
router.get("/", requirePermission("READ_PATIENT"), visitController.list);

/**
 * @route   GET /api/visits/statuses/list
 * @desc    Get all valid visit statuses
 * @access  Private
 */
router.get("/statuses/list", visitController.getValidStatuses);

/**
 * @route   GET /api/visits/patient/:patientId
 * @desc    Get all visits for a patient
 * @access  Private
 */
router.get(
  "/patient/:patientId",
  requirePermission("READ_PATIENT"),
  visitController.getByPatientId,
);

/**
 * @route   GET /api/visits/:id/summary
 * @desc    Get visit summary/timeline
 * @access  Private
 */
router.get(
  "/:id/summary",
  requirePermission("READ_PATIENT"),
  visitController.getVisitSummary,
);

/**
 * @route   GET /api/visits/:id
 * @desc    Get visit by ID
 * @access  Private
 */
router.get("/:id", requirePermission("READ_PATIENT"), visitController.getById);

/**
 * @route   PUT /api/visits/:id/status
 * @desc    Update visit status (workflow progression)
 * @access  Private
 */
router.put(
  "/:id/status",
  requirePermission("CREATE_PATIENT"),
  visitController.updateStatus,
);

/**
 * @route   PUT /api/visits/:id/triage
 * @desc    Link triage record to visit
 * @access  Private
 */
router.put(
  "/:id/triage",
  requirePermission("WRITE_VITALS"),
  visitController.linkTriage,
);

/**
 * @route   PUT /api/visits/:id/consultation
 * @desc    Link consultation to visit
 * @access  Private
 */
router.put(
  "/:id/consultation",
  requirePermission("CREATE_RECORD"),
  visitController.linkConsultation,
);

/**
 * @route   PUT /api/visits/:id/lab
 * @desc    Link lab request to visit
 * @access  Private
 */
router.put(
  "/:id/lab",
  requirePermission("CREATE_RECORD"),
  visitController.linkLabRequest,
);

/**
 * @route   PUT /api/visits/:id/prescription
 * @desc    Link prescription to visit
 * @access  Private
 */
router.put(
  "/:id/prescription",
  requirePermission("CREATE_RECORD"),
  visitController.linkPrescription,
);

/**
 * @route   PUT /api/visits/:id/invoice
 * @desc    Link invoice to visit
 * @access  Private
 */
router.put(
  "/:id/invoice",
  requirePermission("GENERATE_INVOICE"),
  visitController.linkInvoice,
);

/**
 * @route   POST /api/visits/:id/payment
 * @desc    Record payment for visit
 * @access  Private
 */
router.post(
  "/:id/payment",
  requirePermission("COLLECT_PAYMENT"),
  visitController.recordPayment,
);

/**
 * @route   POST /api/visits/:id/close
 * @desc    Close visit
 * @access  Private
 */
router.post(
  "/:id/close",
  requirePermission("CREATE_PATIENT"),
  visitController.closeVisit,
);

module.exports = router;
