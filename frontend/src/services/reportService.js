import api from './api';

const reportService = {
  getSummary: async (params) => {
    const res = await api.get('/reports/summary', { params });
    return res.data;
  },
  getRevenue: async (params) => {
    const res = await api.get('/reports/revenue', { params });
    return res.data;
  },
  getPatients: async (params) => {
    const res = await api.get('/reports/patients', { params });
    return res.data;
  },
  getAppointments: async (params) => {
    const res = await api.get('/reports/appointments', { params });
    return res.data;
  },
  getLaboratory: async (params) => {
    const res = await api.get('/reports/laboratory', { params });
    return res.data;
  },
};

export default reportService;
