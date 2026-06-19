import api from './api';

const labService = {
  getAll: async (params) => {
    const res = await api.get('/labs/requests', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/labs/requests/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/labs/requests', data);
    return res.data;
  },
  updateResult: async (id, data) => {
    const res = await api.put(`/labs/requests/${id}/result`, data);
    return res.data;
  },
  collectSample: async (id) => {
    const res = await api.put(`/labs/requests/${id}/collect`);
    return res.data;
  },
  approveResults: async (id) => {
    const res = await api.put(`/labs/requests/${id}/approve`);
    return res.data;
  },
};

export default labService;
