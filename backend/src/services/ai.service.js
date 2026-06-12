const db = require("../config/db");
const { APIError } = require("../middlewares/error");

const getGeminiModel = () => process.env.GEMINI_MODEL || "gemini-1.5-flash";
const hasGeminiApiKey = () =>
  Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY",
  );

const sanitizePrompt = (text) => {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[\r\n\t]+/g, " ").trim();
};

const redactPHI = (text, patientInfo = {}) => {
  if (!text) return { text: "", mapping: {} };
  let redacted = text;
  const mapping = {};

  const labels = [
    { key: "full_name", replacement: "[PATIENT_NAME_TOKEN]" },
    { key: "first_name", replacement: "[PATIENT_FIRST_NAME_TOKEN]" },
    { key: "last_name", replacement: "[PATIENT_LAST_NAME_TOKEN]" },
    { key: "mrn", replacement: "[PATIENT_MRN_TOKEN]" },
    { key: "phone_number", replacement: "[PATIENT_PHONE_TOKEN]" },
  ];

  labels.forEach(({ key, replacement }) => {
    const value = patientInfo[key];
    if (!value || typeof value !== "string") return;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    if (regex.test(redacted)) {
      redacted = redacted.replace(regex, replacement);
      mapping[replacement] = value;
    }
  });

  return { text: redacted, mapping };
};

const rehydrateText = (text, mapping = {}) => {
  if (!text) return "";
  let result = text;
  Object.entries(mapping).forEach(([token, value]) => {
    result = result.split(token).join(value);
  });
  return result;
};

const callGemini = async (promptText, temperature = 0.2) => {
  if (!hasGeminiApiKey()) return null;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature,
        candidateCount: 1,
        maxOutputTokens: 400,
        contents: [
          {
            parts: [
              {
                text: sanitizePrompt(promptText),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini] API response error", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("[Gemini] call failed", error?.message || error);
    return null;
  }
};

const logAiAudit = async ({
  clinicId,
  userId,
  actionType,
  affectedTable,
  affectedRecordId,
  oldValues,
  newValues,
  req,
}) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, old_values, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        clinicId || null,
        userId || null,
        actionType,
        affectedTable || "ai_service",
        affectedRecordId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || null,
        req?.headers?.["user-agent"] || null,
      ],
    );
  } catch (error) {
    console.warn(
      "[AI Audit] Failed to persist audit log:",
      error.message || error,
    );
  }
};

const buildLabAnalysisPrompt = (patient, labResult) => {
  const patientContext = `Patient: ${patient?.full_name || "[PATIENT_NAME_TOKEN]"}${patient?.age ? `, Age: ${patient.age}` : ""}${patient?.gender ? `, Gender: ${patient.gender}` : ""}${patient?.mrn ? `, MRN: ${patient.mrn}` : ""}`;
  const labFacts = `Lab Test: ${labResult.test_name || "Unknown test"}\nResult Summary: ${labResult.result || "No result available"}\nInterpretation Notes: ${labResult.interpretation || "No interpretation provided"}`;

  return `You are a professional clinical AI assistant helping a licensed provider interpret laboratory findings.
Use a structured clinical format with clear sections: 'Summary', 'Key Findings', and 'Suggested Next Steps'. Identify any values likely out of range. Do not offer a final medical diagnosis. Remind the clinician to confirm with patient context and vital signs.

${patientContext}
${labFacts}

Provide a concise interpretation and practical action guidance:`;
};

const buildClinicalSuggestionPrompt = (patient, consultation) => {
  const complaint = consultation?.complaint || "No chief complaint provided";
  const vitals = consultation?.vitals
    ? JSON.stringify(consultation.vitals)
    : "No vital signs provided";
  const history = consultation?.history || "No additional history available";
  const exam =
    consultation?.physical_exam || "No physical exam findings provided";

  return `You are a clinical decision support assistant creating safe suggestions for a provider.
Summarize the likely clinical priorities, recommended next tests, and possible provisional management options.
Do not replace clinician judgment. Do not invent diagnoses without supporting data.

Patient: ${patient?.full_name || "[PATIENT_NAME_TOKEN]"}${patient?.age ? `, Age: ${patient.age}` : ""}${patient?.gender ? `, Gender: ${patient.gender}` : ""}
Chief Complaint: ${complaint}
Vitals: ${vitals}
History / Notes: ${history}
Physical Exam: ${exam}

Provide a short clinical suggestion and next step guidance:`;
};

const buildPatientSummaryPrompt = (patient, visits) => {
  const patientFacts = `Patient Name: ${patient?.full_name || "[PATIENT_NAME_TOKEN]"}${patient?.age ? `, Age: ${patient.age}` : ""}${patient?.gender ? `, Gender: ${patient.gender}` : ""}`;
  const visitHistory =
    visits && visits.length
      ? visits
          .map(
            (v, idx) =>
              `Visit ${idx + 1}: ${v.date || "unknown date"} — ${v.complaint || v.diagnosis || "no details"}`,
          )
          .join("\n")
      : "No recent visit history available.";

  return `You are a medical record summarization assistant.
Create a clinical summary paragraph that highlights the patient's current presentation, recent visit history, key diagnoses, and next care priorities.
Keep it concise and suitable for handoff notes.

${patientFacts}
Recent Visits:\n${visitHistory}

Provide a helpful patient summary:`;
};

const buildPharmacyInsightPrompt = (medicines) => {
  const inventorySnapshot = medicines
    .slice(0, 20)
    .map(
      (m) =>
        `${m.name} (${m.category}) — Stock: ${m.stock}, Status: ${m.status || "unknown"}`,
    )
    .join("\n");

  return `You are a pharmacy operations assistant helping a clinic optimize medication inventory and dispensing safety.
Review the current stock snapshot below. Highlight medicines that require restocking, suggest substitutions for low or out-of-stock items, and call out potential inventory risk for essential treatments.

Inventory Snapshot:\n${inventorySnapshot}

Provide a concise pharmacy insight report:`;
};

const buildDashboardInsightPrompt = (metrics) => {
  const metricLines = Object.entries(metrics || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return `You are a health operations analyst. Review the clinic performance metrics below and highlight the top three operational opportunities, patient safety observations, or risk factors. Keep it actionable for the clinic manager.

Metrics:\n${metricLines}

Provide an insight summary:`;
};

const renderGeminiOrFallback = async (promptText, fallbackText) => {
  const response = await callGemini(promptText);
  return response || fallbackText;
};

const parseJsonSafely = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const labAnalysis = async ({ tenantId, req, patient, labResult, userId }) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || patient?.patient_uid || "",
    phone_number: patient?.phone_number || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };

  const prompt = buildLabAnalysisPrompt(safePatient, labResult);
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(
    redactedPrompt,
    `Draft analysis for ${labResult.test_name || "lab result"}:\n- Review result values and compare to expected ranges.\n- Follow up with confirmatory tests if indicated.\n- Treat in context of patient symptoms and vitals.`,
  );
  const answer = rehydrateText(generated, mapping);

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_LAB_ANALYSIS",
    affectedTable: "lab_results",
    affectedRecordId: labResult.id || null,
    newValues: { analysis: answer },
    req,
  });

  return { analysis: answer };
};

const patientSummary = async ({ tenantId, req, patient, visits, userId }) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || patient?.patient_uid || "",
    phone_number: patient?.phone_number || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };

  const prompt = buildPatientSummaryPrompt(safePatient, visits || []);
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(
    redactedPrompt,
    `Patient summary for ${safePatient.full_name || "this patient"}:\n- Concise overview of demographics and current status.\n- Recent visit history and care priorities.`,
  );
  const answer = rehydrateText(generated, mapping);

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_PATIENT_SUMMARY",
    affectedTable: "patients",
    affectedRecordId: patient?.id || null,
    newValues: { summary: answer },
    req,
  });

  return { summary: answer };
};

const clinicalSuggestion = async ({
  tenantId,
  req,
  patient,
  consultation,
  userId,
}) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || patient?.patient_uid || "",
    phone_number: patient?.phone_number || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };
  const prompt = buildClinicalSuggestionPrompt(safePatient, consultation || {});
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(
    redactedPrompt,
    `Clinical suggestion draft:\n- Summarize priorities.\n- Recommend next diagnostic or treatment step.\n- Highlight patient safety concerns if any.`,
  );
  const answer = rehydrateText(generated, mapping);

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_CLINICAL_SUGGESTION",
    affectedTable: "consultations",
    affectedRecordId: consultation?.id || null,
    newValues: { suggestion: answer },
    req,
  });

  return { suggestion: answer };
};

const pharmacyInsight = async ({ tenantId, req, medicines, userId }) => {
  const safeMedicines = Array.isArray(medicines)
    ? medicines.map((m) => ({
        name: m.name,
        category: m.category,
        stock: m.stock,
        status: m.status,
      }))
    : [];
  const prompt = buildPharmacyInsightPrompt(safeMedicines);
  const generated = await renderGeminiOrFallback(
    prompt,
    `Pharmacy insight summary:\n- Identify low stock and reorder risk.\n- Call out essential medication gaps.\n- Recommend inventory focus for the next clinic week.`,
  );

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_PHARMACY_INSIGHT",
    affectedTable: "medicines",
    newValues: { insight: generated },
    req,
  });

  return { insight: generated };
};

const dashboardInsight = async ({ tenantId, req, metrics, userId }) => {
  const prompt = buildDashboardInsightPrompt(metrics || {});
  const generated = await renderGeminiOrFallback(
    prompt,
    `Dashboard insight summary:\n- Point out operational opportunities.\n- Identify any risk signals from clinic metrics.\n- Recommend next priorities for the manager.`,
  );

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_DASHBOARD_INSIGHT",
    affectedTable: "dashboard_metrics",
    newValues: { insight: generated },
    req,
  });

  return { insight: generated };
};

const generateClinicalSummary = async ({
  tenantId,
  req,
  patient,
  visits,
  userId,
}) => {
  return patientSummary({ tenantId, req, patient, visits, userId });
};

const checkPrescription = async ({
  tenantId,
  req,
  patient,
  medication_name,
  allergies,
  diagnoses,
  userId,
}) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || patient?.patient_uid || "",
    phone_number: patient?.phone_number || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };
  const prompt = `You are an expert clinical pharmacist. Analyze whether the proposed medication is safe for this patient. Mention any possible allergy or disease contraindications and suggest alternatives if needed.

Patient: ${safePatient.full_name}
Age: ${safePatient.age || "unknown"}
Gender: ${safePatient.gender || "unknown"}
Proposed Medication: ${medication_name}
Allergies: ${allergies || "none"}
Diagnoses: ${diagnoses || "none"}

Provide a concise medication safety check:`;

  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  let generated = await renderGeminiOrFallback(
    redactedPrompt,
    `Medication safety check:\n- Severity: none or check allergies.\n- Alternative suggestions: ...`,
  );
  generated = rehydrateText(generated, mapping);

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_PRESCRIPTION_CHECK",
    affectedTable: "prescriptions",
    newValues: { medication_name, allergies, diagnoses, result: generated },
    req,
  });

  return { interaction_draft: generated };
};

const summarizeMedicalReport = async ({
  report_text,
  req,
  userId,
  tenantId,
}) => {
  const prompt = `You are a clinical documentation specialist. Summarize the following medical report into a concise structured outline with sections 'Key Findings' and 'Clinical Recommendations'. Use professional language.

Report Text:\n${report_text}

Summary:`;
  const generated = await renderGeminiOrFallback(
    prompt,
    `Key Findings:\n- ...\nClinical Recommendations:\n- ...`,
  );

  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_REPORT_SUMMARY",
    affectedTable: "medical_reports",
    newValues: { summary: generated },
    req,
  });

  return { summary: generated };
};

module.exports = {
  labAnalysis,
  patientSummary,
  clinicalSuggestion,
  pharmacyInsight,
  dashboardInsight,
  generateClinicalSummary,
  checkPrescription,
  summarizeMedicalReport,
};
