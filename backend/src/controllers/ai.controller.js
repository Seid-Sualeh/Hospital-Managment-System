const db = require("../config/db");
const { APIError } = require("../middlewares/error");
const aiService = require("../services/ai.service");

// In-Memory Redactor & Rehydrator Helper for PHI Safety
const redactPHI = (text, patientInfo) => {
  if (!text) return { text: "", mapping: {} };
  const mapping = {};
  let redacted = text;

  // Patient names
  if (patientInfo.first_name) {
    const fullName = `${patientInfo.first_name} ${patientInfo.last_name}`;
    const nameRegex = new RegExp(fullName, "gi");
    redacted = redacted.replace(nameRegex, "[PATIENT_NAME_TOKEN]");
    mapping["[PATIENT_NAME_TOKEN]"] = fullName;

    const firstNameRegex = new RegExp(patientInfo.first_name, "gi");
    redacted = redacted.replace(firstNameRegex, "[PATIENT_FIRST_NAME_TOKEN]");
    mapping["[PATIENT_FIRST_NAME_TOKEN]"] = patientInfo.first_name;
  }

  // MRN
  if (patientInfo.mrn) {
    const mrnRegex = new RegExp(patientInfo.mrn, "gi");
    redacted = redacted.replace(mrnRegex, "[PATIENT_MRN_TOKEN]");
    mapping["[PATIENT_MRN_TOKEN]"] = patientInfo.mrn;
  }

  // Phone
  if (patientInfo.phone_number) {
    const phoneRegex = new RegExp(
      patientInfo.phone_number.replace("+", "\\+"),
      "g",
    );
    redacted = redacted.replace(phoneRegex, "[PATIENT_PHONE_TOKEN]");
    mapping["[PATIENT_PHONE_TOKEN]"] = patientInfo.phone_number;
  }

  return { text: redacted, mapping };
};

const rehydrateText = (text, mapping) => {
  if (!text) return "";
  let rehydrated = text;
  Object.keys(mapping).forEach((token) => {
    rehydrated = rehydrated.replaceAll(token, mapping[token]);
  });
  return rehydrated;
};

const aiController = {
  // 1. Laboratory Result Explanation
  explainLabResult: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { lab_result_id } = req.body;

      if (!lab_result_id) {
        throw new APIError(
          "Laboratory result ID is required.",
          400,
          "BAD_REQUEST",
        );
      }

      // Fetch lab result joined with patient demographics
      const query = `
        SELECT lr.*, p.first_name, p.middle_name, p.last_name, p.gender, p.mrn, p.phone_number,
               TIMESTAMPDIFF(YEAR, p.dob_gregorian, CURDATE()) as age
        FROM lab_results lr
        JOIN patients p ON lr.patient_id = p.id
        WHERE lr.id = ? AND lr.clinic_id = ?
        LIMIT 1
      `;
      const [result] = await db.query(query, [lab_result_id, tenantId]);

      if (!result) {
        throw new APIError(
          "Laboratory result record not found.",
          404,
          "RECORD_NOT_FOUND",
        );
      }

      let resultsObj = {};
      try {
        resultsObj =
          typeof result.results_json === "string"
            ? JSON.parse(result.results_json)
            : result.results_json;
      } catch (e) {
        resultsObj = {};
      }

      const patientInfo = {
        first_name: result.first_name,
        last_name: result.last_name,
        mrn: result.mrn,
        phone_number: result.phone_number,
      };

      const explanation = await aiService.labSummary({
        tenantId,
        req,
        patient: { ...result, full_name: `${result.first_name} ${result.last_name}` },
        labResult: result,
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        data: {
          explanation_draft: explanation.summary,
          disclaimer:
            "AI-generated draft. Licensed clinician must verify and approve final diagnostic values.",
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Clinical Summary Generator
  generateClinicalSummary: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id } = req.body;

      if (!patient_id) {
        throw new APIError("Patient ID is required.", 400, "BAD_REQUEST");
      }

      // Fetch patient demographics
      const [patient] = await db.query(
        "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
        [patient_id, tenantId],
      );
      if (!patient) {
        throw new APIError(
          "Patient record not found.",
          404,
          "PATIENT_NOT_FOUND",
        );
      }

      // Fetch recent 3 consultations
      const consultations = await db.query(
        "SELECT chief_complaints, vitals, diagnoses, consultation_datetime FROM consultations WHERE patient_id = ? AND clinic_id = ? ORDER BY consultation_datetime DESC LIMIT 3",
        [patient_id, tenantId],
      );

      const visits = consultations.map((c) => {
        let parsedVitals = {};
        let parsedDiag = {};
        try {
          parsedVitals =
            typeof c.vitals === "string" ? JSON.parse(c.vitals) : c.vitals;
          parsedDiag =
            typeof c.diagnoses === "string"
              ? JSON.parse(c.diagnoses)
              : c.diagnoses;
        } catch (e) {}

        return {
          date: c.consultation_datetime,
          complaint: c.chief_complaints,
          vitals: parsedVitals,
          diagnoses: parsedDiag,
        };
      });

      const summary = await aiService.patientSummary({
        tenantId,
        req,
        patient: { ...patient, full_name: `${patient.first_name} ${patient.last_name}` },
        visits,
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        data: {
          summary_draft: summary.summary,
          disclaimer: aiService.AI_DISCLAIMER,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Lab Analysis
  labAnalysis: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { lab_result_id } = req.body;

      if (!lab_result_id) {
        throw new APIError(
          "Laboratory result ID is required.",
          400,
          "BAD_REQUEST",
        );
      }

      let labResult = null;
      try {
        const q = `SELECT lr.*, p.first_name, p.middle_name, p.last_name, p.gender, p.mrn, p.phone_number, TIMESTAMPDIFF(YEAR, p.dob_gregorian, CURDATE()) as age FROM lab_results lr JOIN patients p ON lr.patient_id = p.id WHERE lr.id = ? AND lr.clinic_id = ? LIMIT 1`;
        const rows = await db.query(q, [lab_result_id, tenantId]);
        labResult = Array.isArray(rows) ? rows[0] : null;
      } catch (e) {
        labResult = null;
      }

      const patient = labResult
        ? await (async () => {
            try {
              const rows = await db.query(
                "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
                [labResult.patient_id, tenantId],
              );
              return Array.isArray(rows) ? rows[0] : null;
            } catch {
              return null;
            }
          })()
        : null;

      const response = await aiService.labAnalysis({
        tenantId,
        req,
        patient,
        labResult: labResult || req.body,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 4. Patient Summary
  patientSummary: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id } = req.body;
      if (!patient_id)
        throw new APIError("Patient ID is required.", 400, "BAD_REQUEST");

      const [patientRows] = await db.query(
        "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
        [patient_id, tenantId],
      );
      const patient = patientRows || null;
      const visits = await db.query(
        "SELECT chief_complaints, vitals, diagnoses, consultation_datetime FROM consultations WHERE patient_id = ? AND clinic_id = ? ORDER BY consultation_datetime DESC LIMIT 5",
        [patient_id, tenantId],
      );

      const response = await aiService.patientSummary({
        tenantId,
        req,
        patient: patient ? { ...patient, full_name: `${patient.first_name} ${patient.last_name}` } : null,
        visits,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 5. Clinical Suggestion
  clinicalSuggestion: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { consultation_id, patient_id } = req.body;
      let consultation = null;
      if (consultation_id) {
        const rows = await db.query(
          "SELECT * FROM consultations WHERE id = ? AND clinic_id = ? LIMIT 1",
          [consultation_id, tenantId],
        );
        consultation = Array.isArray(rows) ? rows[0] : null;
      }
      if (!consultation) {
        consultation = {
          complaint: req.body.complaint,
          vitals: req.body.vitals,
          history: req.body.history,
          physical_exam: req.body.physical_exam,
        };
      }
      
      let patient = null;
      if (patient_id) {
        const rows = await db.query(
          "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
          [patient_id, tenantId],
        );
        patient = Array.isArray(rows) ? rows[0] : null;
      }

      const response = await aiService.clinicalSuggestion({
        tenantId,
        req,
        patient: patient ? { ...patient, full_name: `${patient.first_name} ${patient.last_name}` } : null,
        consultation,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 6. Pharmacy Insight
  pharmacyInsight: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      let medicines = req.body.medicines;
      if (!Array.isArray(medicines)) {
        const rows = await db.query(
          "SELECT id, name, category, stock, unit, status FROM medicines WHERE clinic_id = ? ORDER BY stock ASC LIMIT 50",
          [tenantId],
        );
        medicines = Array.isArray(rows) ? rows : [];
      }
      const response = await aiService.pharmacyInsight({
        tenantId,
        req,
        medicines,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 7. Dashboard Insight
  dashboardInsight: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      let metrics = req.body.metrics;
      if (!metrics || typeof metrics !== "object") {
        const metricsObj = {
          totalPatients:
            (
              await db.query(
                "SELECT COUNT(*) AS count FROM patients WHERE clinic_id = ?",
                [tenantId],
              )
            )?.[0]?.count || 0,
          totalAppointments:
            (
              await db.query(
                "SELECT COUNT(*) AS count FROM appointments WHERE clinic_id = ?",
                [tenantId],
              )
            )?.[0]?.count || 0,
          labResults:
            (
              await db.query(
                "SELECT COUNT(*) AS count FROM lab_results WHERE clinic_id = ?",
                [tenantId],
              )
            )?.[0]?.count || 0,
        };
        metrics = metricsObj;
      }
      const response = await aiService.dashboardInsight({
        tenantId,
        req,
        metrics,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 8. Prescription Safety Check
  checkPrescription: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id, medication_name, allergies, diagnoses } = req.body;

      if (!patient_id || !medication_name) {
        throw new APIError(
          "Patient ID and proposed medication name are required.",
          400,
          "BAD_REQUEST",
        );
      }

      // Fetch patient demographics
      const [patient] = await db.query(
        "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
        [patient_id, tenantId],
      );
      if (!patient) {
        throw new APIError(
          "Patient record not found.",
          404,
          "PATIENT_NOT_FOUND",
        );
      }

      const checkRes = await aiService.checkPrescription({
        tenantId,
        req,
        patient: { ...patient, full_name: `${patient.first_name} ${patient.last_name}` },
        medication_name,
        allergies,
        diagnoses,
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        data: checkRes,
      });
    } catch (error) {
      next(error);
    }
  },

  // 9. Medical Report Summarization
  summarizeMedicalReport: async (req, res, next) => {
    try {
      const { report_text } = req.body;
      const tenantId = req.tenantId;

      if (!report_text || report_text.trim().length === 0) {
        throw new APIError(
          "Report text content is required.",
          400,
          "BAD_REQUEST",
        );
      }

      const summary = await aiService.summarizeMedicalReport({
        report_text,
        req,
        userId: req.user?.id,
        tenantId,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  // 10. Diagnosis Support
  diagnosisSupport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id, consultation } = req.body;
      let patient = null;
      if (patient_id) {
        const rows = await db.query(
          "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
          [patient_id, tenantId],
        );
        patient = rows?.[0] || null;
      }
      const response = await aiService.diagnosisSupport({
        tenantId,
        req,
        patient: patient || req.body.patient,
        consultation: consultation || req.body,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 11. Medication Assistance
  medicationAssistance: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patient_id, diagnosis, prescription, allergies, current_medications } = req.body;
      let patient = null;
      if (patient_id) {
        const rows = await db.query(
          "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
          [patient_id, tenantId],
        );
        patient = rows?.[0] || null;
      }
      const response = await aiService.medicationAssistance({
        tenantId,
        req,
        patient: patient || req.body.patient,
        payload: { diagnosis, prescription, allergies, current_medications, medication_name: prescription },
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 12. Lab Summary
  labSummary: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { lab_result_id, lab_request_id, result, interpretation, test_name, patient_id } = req.body;
      let labResult = { result, interpretation, test_name };
      let patient = null;

      if (lab_result_id) {
        const rows = await db.query(
          `SELECT lr.*, p.first_name, p.last_name, p.gender, p.mrn,
                  TIMESTAMPDIFF(YEAR, p.dob_gregorian, CURDATE()) as age
           FROM lab_results lr JOIN patients p ON lr.patient_id = p.id
           WHERE lr.id = ? AND lr.clinic_id = ? LIMIT 1`,
          [lab_result_id, tenantId],
        );
        if (rows?.[0]) {
          labResult = rows[0];
          patient = rows[0];
        }
      } else if (patient_id) {
        const rows = await db.query(
          "SELECT *, TIMESTAMPDIFF(YEAR, dob_gregorian, CURDATE()) as age FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
          [patient_id, tenantId],
        );
        patient = rows?.[0] || null;
      }

      const response = await aiService.labSummary({
        tenantId,
        req,
        patient,
        labResult: { ...labResult, id: lab_result_id, lab_request_id },
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 13. Lab Abnormal Detection
  labAbnormalDetection: async (req, res, next) => {
    try {
      const { result, interpretation, results_json } = req.body;
      const response = await aiService.detectLabAbnormalities({
        labResult: { result, interpretation, results_json },
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 14. Dashboard Insights
  dashboardInsights: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const [patientCount] = await db.query("SELECT COUNT(*) as total FROM patients WHERE clinic_id = ?", [tenantId]);
      const [appointmentCount] = await db.query("SELECT COUNT(*) as total FROM appointments WHERE clinic_id = ?", [tenantId]);
      const [labCount] = await db.query("SELECT COUNT(*) as total FROM lab_requests WHERE clinic_id = ?", [tenantId]);
      const [revenueRow] = await db.query(
        "SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE clinic_id = ? AND status != 'void'",
        [tenantId],
      );
      const [todayRevenue] = await db.query(
        "SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE clinic_id = ? AND payment_status = 'completed' AND DATE(payment_date) = CURDATE()",
        [tenantId],
      );
      const metrics = {
        totalPatients: patientCount?.total || 0,
        totalAppointments: appointmentCount?.total || 0,
        labRequests: labCount?.total || 0,
        totalRevenue: revenueRow?.total || 0,
        todayRevenue: todayRevenue?.total || 0,
        ...(req.body.metrics || {}),
      };
      const response = await aiService.dashboardInsights({
        tenantId,
        req,
        metrics,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // 15. Pharmacy Insights
  pharmacyInsights: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      let medicines = req.body.medicines;
      if (!Array.isArray(medicines)) {
        const rows = await db.query(
          "SELECT id, name, generic_name, dosage_form, quantity_in_stock, reorder_level, unit_price, expiry_date FROM medicines WHERE clinic_id = ? AND is_active = TRUE ORDER BY quantity_in_stock ASC LIMIT 50",
          [tenantId],
        );
        medicines = (rows || []).map((m) => ({
          ...m,
          stock: m.quantity_in_stock,
          status: m.quantity_in_stock === 0 ? "out_of_stock" : m.quantity_in_stock <= m.reorder_level ? "low_stock" : "in_stock",
          category: m.dosage_form,
        }));
      }
      const response = await aiService.pharmacyInsights({
        tenantId,
        req,
        medicines,
        safetyContext: req.body.safetyContext || {},
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = aiController;
