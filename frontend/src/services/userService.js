import api from './api';

const userService = {
  getAll: async (params) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};

export default userService;
