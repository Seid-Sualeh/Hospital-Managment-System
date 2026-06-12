import api from './api';

const appointmentService = {
  getAll: async (params) => {
    const res = await api.get('/appointments', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/appointments', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/appointments/${id}`, data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/appointments/${id}/status`, { status });
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },
};

export default appointmentService;
