import api from './api';

const patientService = {
  getAll: async (params = {}) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/patients', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/patients/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/patients', { params: { search: query } });
    return response.data;
  },
};

export default patientService;
