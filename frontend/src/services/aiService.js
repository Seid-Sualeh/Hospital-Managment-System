import api from "./api";

const unwrap = (res) => res.data;

const aiService = {
  clinicalSummary: (payload) => api.post("/ai/clinical-summary", payload).then(unwrap),
  diagnosisSupport: (payload) => api.post("/ai/diagnosis-support", payload).then(unwrap),
  medicationAssistance: (payload) => api.post("/ai/medication-assistance", payload).then(unwrap),
  clinicalSuggestion: (payload) => api.post("/ai/clinical-suggestion", payload).then(unwrap),
  prescriptionAssistance: (payload) => api.post("/ai/prescription-assistance", payload).then(unwrap),

  explainLabResult: (payload) => api.post("/ai/lab-explanation", payload).then(unwrap),
  labAnalysis: (payload) => api.post("/ai/lab-analysis", payload).then(unwrap),
  labSummary: (payload) => api.post("/ai/lab-summary", payload).then(unwrap),
  labAbnormalDetection: (payload) => api.post("/ai/lab-abnormal-detection", payload).then(unwrap),

  dashboardInsights: (payload) => api.post("/ai/dashboard-insights", payload).then(unwrap),
  dashboardInsight: (payload) => api.post("/ai/dashboard-insight", payload).then(unwrap),

  pharmacyInsights: (payload) => api.post("/ai/pharmacy-insights", payload).then(unwrap),
  pharmacyInsight: (payload) => api.post("/ai/pharmacy-insight", payload).then(unwrap),

  patientSummary: (payload) => api.post("/ai/patient-summary", payload).then(unwrap),
  reportSummarization: (payload) => api.post("/ai/report-summarization", payload).then(unwrap),
};

export default aiService;
