import api from './api';

const labService = {
  getAll: async (params) => {
    const res = await api.get('/lab-requests', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/lab-requests/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/lab-requests', data);
    return res.data;
  },
  updateResult: async (id, data) => {
    const res = await api.put(`/lab-requests/${id}/result`, data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/lab-requests/${id}/status`, { status });
    return res.data;
  },
};

export default labService;
