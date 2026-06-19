const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authenticateUser, requirePermission, requireRole } = require("../middlewares/auth");

const clinicalRead = [authenticateUser, requireRole(1, 2, 3, 5, 6), requirePermission("READ_RECORD")];
const doctorWrite = [authenticateUser, requireRole(1, 2), requirePermission("CREATE_RECORD")];
const pharmacist = [authenticateUser, requireRole(1, 5), requirePermission("MANAGE_STOCK")];
const adminOnly = [authenticateUser, requireRole(1)];

// Laboratory AI
router.post("/lab-explanation", ...clinicalRead, aiController.explainLabResult);
router.post("/lab-analysis", ...clinicalRead, aiController.labAnalysis);
router.post("/lab-summary", ...clinicalRead, aiController.labSummary);
router.post("/lab-abnormal-detection", ...clinicalRead, aiController.labAbnormalDetection);

// Consultation AI
router.post("/clinical-summary", ...clinicalRead, aiController.generateClinicalSummary);
router.post("/patient-summary", ...clinicalRead, aiController.patientSummary);
router.post("/diagnosis-support", ...doctorWrite, aiController.diagnosisSupport);
router.post("/clinical-suggestion", ...doctorWrite, aiController.clinicalSuggestion);
router.post("/medication-assistance", ...doctorWrite, aiController.medicationAssistance);
router.post("/prescription-assistance", authenticateUser, requireRole(1, 2, 5), requirePermission("READ_RECORD"), aiController.checkPrescription);

// Pharmacy AI
router.post("/pharmacy-insight", ...pharmacist, aiController.pharmacyInsight);
router.post("/pharmacy-insights", ...pharmacist, aiController.pharmacyInsights);

// Dashboard AI
router.post("/dashboard-insight", ...adminOnly, aiController.dashboardInsight);
router.post("/dashboard-insights", ...adminOnly, aiController.dashboardInsights);

// Reports
router.post("/report-summarization", authenticateUser, requireRole(1, 2), requirePermission("READ_RECORD"), aiController.summarizeMedicalReport);

module.exports = router;
