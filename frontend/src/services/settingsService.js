import api from './api';

const settingsService = {
  get: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  update: async (data) => {
    const res = await api.put('/settings', data);
    return res.data;
  },
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default settingsService;
