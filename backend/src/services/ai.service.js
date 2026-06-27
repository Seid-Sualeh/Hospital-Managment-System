const db = require("../config/db");
const { APIError } = require("../middlewares/error");
const { GoogleGenAI } = require("@google/genai");

// Initialize SDK client (will use API key or OAuth token from env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const hasGeminiApiKey = () =>
  Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY",
  );

const getGeminiModel = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 1. Double check that the environment key is actually loading
console.log("Is API Key Loaded?:", hasGeminiApiKey());
// console.log("Gemini Model:", getGeminiModel());
console.log(
  "Key Prefix:",
  process.env.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY.substring(0, 3)
    : "None",
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

// ✅ Refactored callGemini using latest @google/genai SDK
const callGemini = async (promptText, temperature = 0.2) => {
  if (!hasGeminiApiKey()) {
    throw new APIError(
      "Gemini API key is not configured. Clinical AI features are temporarily unavailable.",
      503,
      "AI_SERVICE_OFFLINE",
    );
  }

  const model = getGeminiModel();
  const maxRetries = 2;
  let attempt = 0;
  let delay = 1000;

  // Sanitize the prompt once
  const sanitizedPrompt = sanitizePrompt(promptText);

  const generationConfig = {
    temperature,
    maxOutputTokens: 1000,
    candidateCount: 1,
  };

  const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ];

  while (attempt <= maxRetries) {
    try {
      // ✅ Correct SDK usage: pass properties directly – no 'input' wrapper.
      // contents can be a plain string or an array of Content objects.
      const res = await ai.models.generateContent({
        model,
        contents: sanitizedPrompt,
        generationConfig,
        safetySettings,
      });

      // Log request/response metadata
      console.error(
        `[Gemini SDK] model=${model} | promptLength=${sanitizedPrompt.length} | responseTextLength=${res?.text?.length || 0}`,
      );
      console.error(`[Gemini SDK] attempt=${attempt + 1} success`);

      // ✅ Use response.text (the recommended property)
      if (res?.text) {
        return res.text;
      }

      // If no text but no explicit error, treat as unexpected
      const errMsg =
        res?.error?.message || res?.error || JSON.stringify(res || {});
      if (/quota|exceeded/i.test(errMsg)) {
        throw new APIError(
          `Clinical AI quota exceeded: ${errMsg}`,
          429,
          "AI_SERVICE_QUOTA_EXCEEDED",
        );
      }
      if (/not found|unsupported|model/i.test(errMsg)) {
        throw new APIError(
          `Clinical AI model not found or unsupported: ${errMsg}`,
          404,
          "AI_SERVICE_MODEL_NOT_FOUND",
        );
      }
      throw new Error(`Unexpected Gemini SDK response: ${errMsg}`);
    } catch (error) {
      const msg = error?.message || String(error);
      console.error(`[Gemini] Attempt ${attempt + 1} failed: ${msg}`);

      // If it's already an APIError, rethrow
      if (error instanceof APIError) throw error;

      // Map common HTTP status codes (if available) to our custom errors
      const status =
        error?.status ||
        error?.code ||
        (error?.response && error.response.status) ||
        null;

      if (status === 400) {
        throw new APIError(
          `Clinical AI invalid request (400): ${msg}`,
          400,
          "AI_SERVICE_INVALID_ARGUMENT",
        );
      }
      if (status === 401) {
        throw new APIError(
          `Clinical AI unauthorized (401): ${msg}`,
          401,
          "AI_SERVICE_UNAUTHORIZED",
        );
      }
      if (status === 403) {
        throw new APIError(
          `Clinical AI permission denied (403): ${msg}`,
          403,
          "AI_SERVICE_FORBIDDEN",
        );
      }
      if (status === 404) {
        throw new APIError(
          `Clinical AI model not found (404): ${msg}`,
          404,
          "AI_SERVICE_MODEL_NOT_FOUND",
        );
      }

      // Rate limit / quota – retry if possible
      if (status === 429 || /rate limit|quota/i.test(msg)) {
        if (attempt === maxRetries) {
          throw new APIError(
            `Clinical AI rate limited: ${msg}`,
            429,
            "AI_SERVICE_RATE_LIMITED",
          );
        }
      }

      // Server errors – retry
      if (status >= 500 || /internal|server error/i.test(msg)) {
        if (attempt === maxRetries) {
          throw new APIError(
            `Clinical AI server error: ${msg}`,
            502,
            "AI_SERVICE_OFFLINE",
          );
        }
      }

      // Timeouts – retry
      if (/timeout|ETIMEDOUT|ECONNRESET/i.test(msg)) {
        if (attempt === maxRetries) {
          throw new APIError(
            "Clinical AI request timed out.",
            504,
            "AI_SERVICE_TIMEOUT",
          );
        }
      }

      // If we have retries left, wait and retry
      if (attempt === maxRetries) {
        throw new APIError(
          "Clinical AI service is temporarily unavailable.",
          503,
          "AI_SERVICE_OFFLINE",
        );
      }

      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
      delay *= 2;
    }
  }

  // Fallback (should never reach here)
  throw new APIError(
    "Clinical AI service is temporarily unavailable.",
    503,
    "AI_SERVICE_OFFLINE",
  );
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

  return `You are a professional Clinical Decision Support System (CDSS) assistant.
Interpret the laboratory results for the patient and structure your response under these exact headings using bold markdown:
**Clinical Interpretation**
**Abnormal Findings**
**Possible Causes**
**Recommended Follow-Up**

CRITICAL RULE: For any abnormal laboratory values, you MUST prefix the parameter with one of these exact tags:
- Use [HIGH] for elevated values (e.g. [HIGH] WBC)
- Use [LOW] for depressed values (e.g. [LOW] Hemoglobin)
- Use [CRITICAL] for life-threatening values

${patientContext}
${labFacts}`;
};

const buildClinicalSuggestionPrompt = (patient, consultation) => {
  const complaint = consultation?.complaint || "No chief complaint provided";
  const vitals = consultation?.vitals
    ? JSON.stringify(consultation.vitals)
    : "No vital signs provided";
  const history = consultation?.history || "No additional history available";
  const exam =
    consultation?.physical_exam || "No physical exam findings provided";

  return `You are a Clinical Decision Support System (CDSS) assistant recommending laboratory and diagnostic tests.
Recommend targeted laboratory tests. You MUST format each recommended test in this exact format:
- [Test Name]: [Brief clinical reason/utility]

For example:
- CBC: Evaluate for leukocytosis or anemia.
- Malaria Smear: Verify Plasmodium parasites due to active fever.

Structure your response into these exact headings using bold markdown:
**Recommended Tests**
**Clinical Priorities**
**Provisional Management**

Patient Profile: Age ${patient?.age || "unknown"}, Gender ${patient?.gender || "unknown"}
Chief Complaint: ${complaint}
Vitals: ${vitals}
History: ${history}
Physical Exam: ${exam}`;
};

const buildPatientSummaryPrompt = (patient, visits) => {
  const patientFacts = `Patient Name: ${patient?.full_name || "[PATIENT_NAME_TOKEN]"}${patient?.age ? `, Age: ${patient.age}` : ""}${patient?.gender ? `, Gender: ${patient.gender}` : ""}`;
  const visitHistory =
    visits && visits.length
      ? visits
          .map(
            (v, idx) =>
              `Visit ${idx + 1}: ${v.date || "unknown date"} — Complaint: ${v.complaint || "none"}, Diagnosis: ${v.diagnosis || "none"}`,
          )
          .join("\n")
      : "No recent visit history available.";

  return `You are a clinical Decision Support System (CDSS) assistant.
Create a comprehensive, structured clinical summary of this patient.
You MUST format your output under these exact headings using bold markdown:
**Patient Overview**
**Current Complaint**
**Relevant History**
**Chronic Conditions**
**Allergies**
**Risk Factors**
**Suggested Next Steps**

Data:
${patientFacts}
Recent Visits:
${visitHistory}`;
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
  if (!response) {
    throw new APIError(
      "Clinical AI service is temporarily offline.",
      503,
      "AI_SERVICE_OFFLINE",
    );
  }
  return response;
};

const AI_DISCLAIMER =
  "This AI output is for clinical decision support only. The licensed clinician remains the final decision maker.";

const parseStructuredSections = (text) => {
  if (!text) return { summary: "", sections: [] };
  const sections = [];
  const lines = text.split("\n").filter(Boolean);
  let current = { title: "Summary", items: [] };

  lines.forEach((line) => {
    const heading =
      line.match(/^\*\*(.+?)\*\*:?$/) || line.match(/^([A-Z][^:]+):$/);
    if (heading) {
      if (current.items.length) sections.push(current);
      current = { title: heading[1].trim(), items: [] };
      return;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      current.items.push(line.replace(/^[-•]\s*/, "").trim());
    } else {
      current.items.push(line.trim());
    }
  });
  if (current.items.length) sections.push(current);
  return { summary: text, sections };
};

const buildDiagnosisSupportPrompt = (patient, consultation) => {
  return `You are a Clinical Decision Support System (CDSS) assistant for licensed physicians.
Analyze the patient presentation and output Suggested Differential Diagnoses.
For each diagnosis, you must estimate a confidence score (percentage) and brief supporting findings.
You MUST format each diagnosis in this exact format:
- [Diagnosis Name] ([Confidence Score]%): [Brief supporting findings]

For example:
- Malaria (82%): Patient reports high fever and chills in endemic region.
- Typhoid Fever (71%): Patient has abdominal pain, prolonged fever, and lethargy.

You must structure the entire response under these exact headings using bold markdown:
**Suggested Differential Diagnoses**
**Clinical Reasoning**
**Recommended Investigations**
**Red Flag Warnings**

Patient Profile: Age ${patient?.age || "unknown"}, Gender ${patient?.gender || "unknown"}
Chief Complaint: ${consultation?.complaint || consultation?.chief_complaints || "Not provided"}
Vitals: ${JSON.stringify(consultation?.vitals || {})}
History/Notes: ${consultation?.history || consultation?.clinical_notes || consultation?.notes || "None"}
Physical Exam: ${consultation?.physical_exam || "Not documented"}`;
};

const buildMedicationAssistancePrompt = (patient, payload) => {
  return `You are a Clinical Decision Support System (CDSS) pharmacist.
Analyze the safety of the proposed medication.
You MUST structure your response into these exact headings using bold markdown:
**Safety Level**
**Interaction Alerts**
**Medication Counseling**
**Alternative Medications**
**Dose Guidance**
**Patient Education Summary**

Under the Safety Level section, you must state one of these options clearly:
- Green: No interactions detected
- Yellow: Use caution
- Red: Severe interaction

Patient: Age ${patient?.age || "unknown"}, Gender ${patient?.gender || "unknown"}
Proposed Medication: ${payload?.medication_name || payload?.prescription || "Not specified"}
Diagnosis: ${payload?.diagnosis || "Not specified"}
Current Medications: ${payload?.current_medications || "None listed"}
Allergies: ${payload?.allergies || "None recorded"}`;
};

const buildLabSummaryPrompt = (patient, labResult) => {
  return `You are a laboratory medicine specialist assisting a clinician.
Interpret the patient's laboratory findings and structure your response under these exact headings using bold markdown:
**Clinical Interpretation**
**Abnormal Findings**
**Possible Causes**
**Recommended Follow-Up**

CRITICAL RULE: For any abnormal laboratory values, you MUST prefix the parameter with one of these exact tags:
- Use [HIGH] for elevated values (e.g. [HIGH] WBC)
- Use [LOW] for depressed values (e.g. [LOW] Hemoglobin)
- Use [CRITICAL] for life-threatening values

Patient: ${patient?.full_name || "[PATIENT]"}
Test: ${labResult?.test_name || "Unknown"}
Results: ${labResult?.result || JSON.stringify(labResult?.results_json || {})}
Notes: ${labResult?.interpretation || "None"}`;
};

const detectAbnormalitiesFromText = (resultText = "") => {
  const text = resultText.toLowerCase();
  const findings = [];

  const rules = [
    {
      pattern: /critical|panic|life.?threat/i,
      severity: "critical",
      label: "Critical value flagged",
    },
    {
      pattern: /high|elevated|increased|above normal|↑/i,
      severity: "moderate",
      label: "Elevated parameter detected",
    },
    {
      pattern: /low|decreased|below normal|↓/i,
      severity: "moderate",
      label: "Depressed parameter detected",
    },
    {
      pattern: /abnormal|positive|reactive/i,
      severity: "mild",
      label: "Abnormal finding noted",
    },
    {
      pattern: /normal|within range|negative|non-reactive/i,
      severity: "normal",
      label: "Values within expected range",
    },
  ];

  rules.forEach((rule) => {
    if (rule.pattern.test(text)) {
      findings.push({
        parameter: "General",
        finding: rule.label,
        severity: rule.severity,
      });
    }
  });

  if (!findings.length) {
    findings.push({
      parameter: "General",
      finding: "No explicit abnormality keywords detected",
      severity: "normal",
    });
  }

  return findings;
};

const buildDashboardInsightsPrompt = (metrics) => {
  return `You are a professional healthcare operations and intelligence analyst.
Analyze the clinic metrics and generate structured insights.
You MUST structure your response under these exact headings using bold markdown:
**Revenue Trends**
**Patient Trends**
**Disease Trends**
**Medication Usage Trends**
**Operational Recommendations**
**Top Diagnoses**
**Top Prescriptions**
**Revenue Growth**
**Patient Volume**
**Inventory Warnings**

Clinic Metrics Data:
${JSON.stringify(metrics, null, 2)}`;
};

const buildPharmacyInsightsPrompt = (medicines, safetyContext) => {
  const inventory = medicines
    .slice(0, 30)
    .map(
      (m) =>
        `${m.name}: stock ${m.stock ?? m.quantity_in_stock}, status ${m.status || "unknown"}, expiry ${m.expiry_date || "N/A"}`,
    )
    .join("\n");

  return `You are a pharmacy operations AI assistant.
You MUST structure your response under these exact headings using bold markdown:
**Low Stock Predictions**
**Expiry Warnings**
**Fast Moving Medicines**
**Slow Moving Medicines**
**Prescription Safety Notes**

Inventory:
${inventory}

Safety Context:
${JSON.stringify(safetyContext || {})}`;
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

const diagnosisSupport = async ({
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
    mrn: patient?.mrn || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };
  const prompt = buildDiagnosisSupportPrompt(safePatient, consultation || {});
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(redactedPrompt);
  const answer = rehydrateText(generated, mapping);
  const structured = parseStructuredSections(answer);
  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_DIAGNOSIS_SUPPORT",
    affectedTable: "consultations",
    affectedRecordId: consultation?.id,
    newValues: { support: answer },
    req,
  });
  return {
    support: answer,
    sections: structured.sections,
    disclaimer: AI_DISCLAIMER,
  };
};

const medicationAssistance = async ({
  tenantId,
  req,
  patient,
  payload,
  userId,
}) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };
  const prompt = buildMedicationAssistancePrompt(safePatient, payload || {});
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(redactedPrompt);
  const answer = rehydrateText(generated, mapping);
  const structured = parseStructuredSections(answer);
  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_MEDICATION_ASSISTANCE",
    affectedTable: "prescriptions",
    newValues: { assistance: answer },
    req,
  });
  return {
    assistance: answer,
    sections: structured.sections,
    disclaimer: AI_DISCLAIMER,
  };
};

const labSummary = async ({ tenantId, req, patient, labResult, userId }) => {
  const safePatient = {
    full_name:
      patient?.full_name ||
      `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    first_name: patient?.first_name || "",
    last_name: patient?.last_name || "",
    mrn: patient?.mrn || "",
    gender: patient?.gender || "",
    age: patient?.age || "",
  };
  const prompt = buildLabSummaryPrompt(safePatient, labResult || {});
  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  const generated = await renderGeminiOrFallback(redactedPrompt);
  const answer = rehydrateText(generated, mapping);
  const structured = parseStructuredSections(answer);
  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_LAB_SUMMARY",
    affectedTable: "lab_results",
    affectedRecordId: labResult?.id,
    newValues: { summary: answer },
    req,
  });
  return {
    summary: answer,
    sections: structured.sections,
    disclaimer: AI_DISCLAIMER,
  };
};

const detectLabAbnormalities = async ({ labResult }) => {
  const resultText = [
    labResult?.result,
    labResult?.interpretation,
    typeof labResult?.results_json === "string"
      ? labResult.results_json
      : JSON.stringify(labResult?.results_json || {}),
  ]
    .filter(Boolean)
    .join(" ");
  const abnormalities = detectAbnormalitiesFromText(resultText);
  return { abnormalities, disclaimer: AI_DISCLAIMER };
};

const dashboardInsights = async ({ tenantId, req, metrics, userId }) => {
  const prompt = buildDashboardInsightsPrompt(metrics || {});
  const generated = await renderGeminiOrFallback(prompt);
  const structured = parseStructuredSections(generated);
  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_DASHBOARD_INSIGHTS",
    affectedTable: "dashboard_metrics",
    newValues: { insights: generated },
    req,
  });
  return {
    insights: generated,
    revenueTrends:
      structured.sections.find((s) =>
        s.title.toLowerCase().includes("revenue"),
      ) || null,
    patientTrends:
      structured.sections.find((s) =>
        s.title.toLowerCase().includes("patient"),
      ) || null,
    recommendations:
      structured.sections.find(
        (s) =>
          s.title.toLowerCase().includes("operational") ||
          s.title.toLowerCase().includes("recommend"),
      ) || null,
    sections: structured.sections,
    disclaimer: AI_DISCLAIMER,
  };
};

const pharmacyInsights = async ({
  tenantId,
  req,
  medicines,
  safetyContext,
  userId,
}) => {
  const safeMedicines = Array.isArray(medicines)
    ? medicines.map((m) => ({
        name: m.name,
        stock: m.stock ?? m.quantity_in_stock,
        status: m.status,
        expiry_date: m.expiry_date,
        category: m.category ?? m.dosage_form,
      }))
    : [];
  const prompt = buildPharmacyInsightsPrompt(safeMedicines, safetyContext);
  const generated = await renderGeminiOrFallback(prompt);
  const structured = parseStructuredSections(generated);
  await logAiAudit({
    clinicId: tenantId,
    userId,
    actionType: "AI_PHARMACY_INSIGHTS",
    affectedTable: "medicines",
    newValues: { insights: generated },
    req,
  });
  return {
    insights: generated,
    sections: structured.sections,
    disclaimer: AI_DISCLAIMER,
  };
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
  const generated = await renderGeminiOrFallback(redactedPrompt);
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
  const generated = await renderGeminiOrFallback(redactedPrompt);
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
  const generated = await renderGeminiOrFallback(redactedPrompt);
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
  const generated = await renderGeminiOrFallback(prompt);

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
  const generated = await renderGeminiOrFallback(prompt);

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
  const prompt = `You are a Clinical Decision Support System (CDSS) pharmacist.
Analyze the safety of the proposed medication.
You MUST structure your response into these exact headings using bold markdown:
**Safety Level**
**Interaction Alerts**
**Medication Counseling**
**Alternative Medications**
**Dose Guidance**
**Patient Education Summary**

Under the Safety Level section, you must state one of these options clearly:
- Green: No interactions detected
- Yellow: Use caution
- Red: Severe interaction

Patient: ${safePatient.full_name} (Age: ${safePatient.age || "unknown"}, Gender: ${safePatient.gender || "unknown"})
Proposed Medication: ${medication_name}
Allergies: ${allergies || "None"}
Diagnoses/Conditions: ${diagnoses || "None"}`;

  const { text: redactedPrompt, mapping } = redactPHI(prompt, safePatient);
  let generated = await renderGeminiOrFallback(redactedPrompt);
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
  const generated = await renderGeminiOrFallback(prompt);

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
  diagnosisSupport,
  medicationAssistance,
  labSummary,
  detectLabAbnormalities,
  dashboardInsights,
  pharmacyInsights,
  AI_DISCLAIMER,
};