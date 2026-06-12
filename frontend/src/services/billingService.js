import api from './api';

const billingService = {
  getInvoices: async (params) => {
    const res = await api.get('/billing/invoices', { params });
    return res.data;
  },
  getInvoiceById: async (id) => {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },
  createInvoice: async (data) => {
    const res = await api.post('/billing/invoices', data);
    return res.data;
  },
  initiatePayment: async (data) => {
    const res = await api.post('/billing/payments/initiate', data);
    return res.data;
  },
  getUnbilled: async (patientId) => {
    const res = await api.get(`/billing/patients/${patientId}/unbilled`);
    return res.data;
  },
};

export default billingService;
