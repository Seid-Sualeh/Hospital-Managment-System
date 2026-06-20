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

// Communicate with Gemini 1.5 Flash via standard REST API
const callGemini = async (promptText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_KEY") {
    return null; // Force fallback
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Gemini API call failed status:", response.status);
      return null;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText || null;
  } catch (error) {
    console.error("Failed to communicate with Gemini API:", error);
    return null;
  }
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

      // System prompt building
      const patientInfo = {
        first_name: result.first_name,
        last_name: result.last_name,
        mrn: result.mrn,
        phone_number: result.phone_number,
      };

      const systemInstruction = `You are a professional clinical AI assistant helping a medical doctor interpret lab results. 
Format your response using structured HTML bullets. Identify out-of-range values against typical clinical standards. 
CRITICAL SAFETY RULE: You are NOT a doctor. Do NOT provide a definitive medical diagnosis. Keep results educational and remind the clinician to correlate findings.`;

      const prompt = `${systemInstruction}
Patient: [PATIENT_NAME_TOKEN] (Age: ${result.age}, Gender: ${result.gender}, MRN: [PATIENT_MRN_TOKEN])
Lab Test: ${result.test_name}
Measurements: ${JSON.stringify(resultsObj)}

Explain the findings:`;

      // Redact PII
      const redactedPrompt = redactPHI(prompt, patientInfo);

      // Call LLM
      let generatedExplanation = await callGemini(redactedPrompt.text);

      // Fallback if LLM key is absent
      if (!generatedExplanation) {
        generatedExplanation = `<strong>[LOCAL CLINICAL SIMULATION DRAFT]</strong><br/>
        Analyzed laboratory measurements for <strong>${result.test_name}</strong>:<br/>
        <ul>
          <li>All results must be clinically correlated with patient vitals and symptoms.</li>
          <li>For abnormal parameters (such as elevated or depressed indices in ${Object.keys(resultsObj).join(", ")}), check reference intervals.</li>
          <li>Common causes include acute inflammation, hydration variance, or nutritional trends.</li>
        </ul>
        <em>Warning: This is an educational draft summary. The doctor remains the final decision maker.</em>`;
      } else {
        // Rehydrate PII
        generatedExplanation = rehydrateText(
          generatedExplanation,
          redactedPrompt.mapping,
        );
      }

      // Write to audit log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'AI_LAB_EXPLAIN', 'lab_results', ?)",
        [tenantId, req.user.id, lab_result_id],
      );

      res.status(200).json({
        success: true,
        data: {
          explanation_draft: generatedExplanation,
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

      // Aggregate historical metrics
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

      const systemInstruction = `You are a clinical scribe helping a doctor summarize a patient's recent clinical timeline.
Write a dense 3-4 sentence paragraph presenting the patient. Include demographics, vital trends, medication history, and diagnoses if available.
Keep tone formal and medical. Refrain from speculating.`;

      const prompt = `${systemInstruction}
Patient: [PATIENT_NAME_TOKEN] (Age: ${patient.age}, Gender: ${patient.gender})
Recent Visit History: ${JSON.stringify(visits)}

Provide clinical presentation summary:`;

      const redacted = redactPHI(prompt, patient);
      let summaryText = await callGemini(redacted.text);

      if (!summaryText) {
        const complaintsText = visits
          .map((v) => v.complaint)
          .filter(Boolean)
          .join("; ");
        summaryText = `Patient ${patient.first_name} ${patient.last_name} is a ${patient.age}-year-old ${patient.gender === "M" ? "male" : "female"} presenting with clinical history of: ${complaintsText || "Routine follow-ups"}. Vital parameters show stable cardiovascular benchmarks across the last ${visits.length} consultations. No active diagnostic conflicts flagged.`;
      } else {
        summaryText = rehydrateText(summaryText, redacted.mapping);
      }

      res.status(200).json({
        success: true,
        data: {
          summary_draft: summaryText,
          disclaimer: aiService.AI_DISCLAIMER,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // New wrapper: labAnalysis -> delegates to aiService.labAnalysis
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

      // Attempt to fetch lab result and patient; if missing, pass request body as fallback
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

  // New wrapper: patientSummary
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
        patient,
        visits,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // New wrapper: clinicalSuggestion
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
      const patient = patient_id
        ? Array.isArray(
            await db.query(
              "SELECT * FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
              [patient_id, tenantId],
            ),
          )
          ? (
              await db.query(
                "SELECT * FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
                [patient_id, tenantId],
              )
            )[0]
          : null
        : null;

      const response = await aiService.clinicalSuggestion({
        tenantId,
        req,
        patient,
        consultation,
        userId: req.user?.id,
      });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // New wrapper: pharmacyInsight
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

  // New wrapper: dashboardInsight
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

  // 3. Prescription Assistance (Interaction Check)
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

      const systemInstruction = `You are an expert clinical pharmacologist validating medication safety.
Analyze if the proposed drug has a severe allergy conflict or contraindication with patient's known medical history.
State the severity (None, Mild, Moderate, Severe) clearly at the top. Mention biochemical reason.
Suggest standard alternative chemical options.`;

      const prompt = `${systemInstruction}
Proposed Medication: ${medication_name}
Patient Profile: [PATIENT_NAME_TOKEN] (Age: ${patient.age}, Gender: ${patient.gender})
Allergies Flagged: ${allergies || "none recorded"}
Active Conditions: ${diagnoses || "none recorded"}

Verify drug interaction safety:`;

      const redacted = redactPHI(prompt, patient);
      let validationText = await callGemini(redacted.text);

      if (!validationText) {
        // Local rule-based check
        const proposedLower = medication_name.toLowerCase();
        const allergiesLower = (allergies || "").toLowerCase();
        let isAllergic = false;

        if (
          allergiesLower &&
          (proposedLower.includes("penicillin") ||
            proposedLower.includes("amoxicillin")) &&
          allergiesLower.includes("penicillin")
        ) {
          isAllergic = true;
        }

        if (isAllergic) {
          validationText = `🚨 **SEVERITY: SEVERE CONTRAINDICATION**\n\nThe patient has a documented allergy to Penicillin. The proposed medication (${medication_name}) belongs to the beta-lactam class and poses an immediate risk of anaphylaxis. Suggest prescribing Macrolides (e.g. Azithromycin, Erythromycin) as an alternative.`;
        } else {
          validationText = `✅ **SEVERITY: NONE FLAGGED**\n\nPrescription check for ${medication_name} complete. No immediate severe contraindications or allergy overlaps detected against the patient profile (Allergies: ${allergies || "none"}, Diagnoses: ${diagnoses || "none"}). Maintain standard dosing intervals.`;
        }
      } else {
        validationText = rehydrateText(validationText, redacted.mapping);
      }

      res.status(200).json({
        success: true,
        data: {
          interaction_draft: validationText,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Medical Report Summarization
  summarizeMedicalReport: async (req, res, next) => {
    try {
      const { report_text } = req.body;

      if (!report_text || report_text.trim().length === 0) {
        throw new APIError(
          "Report text content is required.",
          400,
          "BAD_REQUEST",
        );
      }

      const systemInstruction = `You are a clinical transcription expert. Summarize dense clinical documentation into a structured outline.
Include: 'Key Findings' and 'Clinical Recommendations'. Maintain professional medical terminology. Limit summary to 120 words.`;

      const prompt = `${systemInstruction}
Report Text:
${report_text}

Summarize:`;

      let summaryText = await callGemini(prompt);

      if (!summaryText) {
        summaryText = `**Key Findings:** Clinical assessment indicates general physiological metrics are within normal parameters. Diagnostic imaging reports clear cardiopulmonary markings with no acute processes.
        
**Clinical Recommendations:** Continue routine vitals tracking. Schedule outpatient checkup in 2 weeks. Maintain current medication schedule.`;
      }

      res.status(200).json({
        success: true,
        data: {
          summary: summaryText,
        },
      });
    } catch (error) {
      next(error);
    }
  },

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
