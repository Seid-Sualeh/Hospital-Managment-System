import api from './api';

const aiService = {
  analyzeLabResult: (payload) => api.post('/ai/lab-analysis', payload),
  generatePatientSummary: (payload) => api.post('/ai/patient-summary', payload),
  getClinicalSuggestion: (payload) => api.post('/ai/clinical-suggestion', payload),
  getPharmacyInsight: (payload) => api.post('/ai/pharmacy-insight', payload),
  getDashboardInsight: (payload) => api.post('/ai/dashboard-insight', payload),
};

export default aiService;
