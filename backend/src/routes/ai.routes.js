const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authenticateUser } = require("../middlewares/auth");

// Protected AI assistance endpoints
router.post(
  "/lab-explanation",
  authenticateUser,
  aiController.explainLabResult,
);
router.post("/lab-analysis", authenticateUser, aiController.labAnalysis);
router.post(
  "/clinical-summary",
  authenticateUser,
  aiController.generateClinicalSummary,
);
router.post("/patient-summary", authenticateUser, aiController.patientSummary);
router.post(
  "/clinical-suggestion",
  authenticateUser,
  aiController.clinicalSuggestion,
);
router.post(
  "/prescription-assistance",
  authenticateUser,
  aiController.checkPrescription,
);
router.post(
  "/pharmacy-insight",
  authenticateUser,
  aiController.pharmacyInsight,
);
router.post(
  "/dashboard-insight",
  authenticateUser,
  aiController.dashboardInsight,
);
router.post(
  "/report-summarization",
  authenticateUser,
  aiController.summarizeMedicalReport,
);

module.exports = router;
