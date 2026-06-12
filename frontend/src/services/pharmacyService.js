import api from './api';

const pharmacyService = {
  getAll: async (params) => {
    const res = await api.get('/pharmacy/medicines', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/pharmacy/medicines/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/pharmacy/medicines', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/pharmacy/medicines/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/pharmacy/medicines/${id}`);
    return res.data;
  },
  dispense: async (data) => {
    const res = await api.post('/pharmacy/dispense', data);
    return res.data;
  },
};

export default pharmacyService;
