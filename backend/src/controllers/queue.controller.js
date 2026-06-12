const queueService = require('../services/queue.service');
const { APIError } = require('../middlewares/error');

const queueController = {
  getQueueByType: async (req, res, next) => {
    try {
      const clinicId = req.tenantId;
      const { type } = req.params;
      const queue = await queueService.getQueueByType(clinicId, type);
      res.status(200).json({ success: true, count: queue.length, data: queue });
    } catch (error) {
      next(error);
    }
  },

  listAllQueues: async (req, res, next) => {
    try {
      const clinicId = req.tenantId;
      const { status } = req.query;
      const queue = await queueService.listAllQueues(clinicId, status);
      res.status(200).json({ success: true, count: queue.length, data: queue });
    } catch (error) {
      next(error);
    }
  },

  createQueueEntry: async (req, res, next) => {
    try {
      const clinicId = req.tenantId;
      const { visit_id, queue_type, assigned_to } = req.body;

      if (!visit_id || !queue_type) {
        throw new APIError('Visit ID and queue type are required', 400, 'BAD_REQUEST');
      }

      const result = await queueService.createQueueEntry(visit_id, clinicId, queue_type, assigned_to || null);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  updateQueueStatus: async (req, res, next) => {
    try {
      const clinicId = req.tenantId;
      const { id } = req.params;
      const { status, assigned_to } = req.body;

      if (!status) {
        throw new APIError('Status is required', 400, 'BAD_REQUEST');
      }

      const result = await queueService.updateQueueEntryStatus(id, clinicId, status, assigned_to || null);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = queueController;
