const visitService = require("../services/visit.service");
const db = require("../config/db");
const { APIError } = require("../middlewares/error");

const visitController = {
  /**
   * Create a new visit (patient registration)
   * POST /api/visits
   */
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;
      const { patient_id, reason_for_visit } = req.body;

      if (!patient_id) {
        throw new APIError("Patient ID is required", 400, "BAD_REQUEST");
      }

      // Verify patient exists in this clinic
      const [patient] = await db.query(
        "SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1",
        [patient_id, tenantId],
      );

      if (!patient) {
        throw new APIError(
          "Patient not found in this clinic",
          404,
          "PATIENT_NOT_FOUND",
        );
      }

      const result = await visitService.create(
        patient_id,
        tenantId,
        userId,
        reason_for_visit || null,
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get visit by ID
   * GET /api/visits/:id
   */
  getById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const visit = await visitService.getById(id, tenantId);

      res.status(200).json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all visits for a patient
   * GET /api/visits/patient/:patientId
   */
  getByPatientId: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { patientId } = req.params;

      const visits = await visitService.getByPatientId(patientId, tenantId);

      res.status(200).json({
        success: true,
        count: visits.length,
        data: visits,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all visits with optional filters
   * GET /api/visits
   */
  list: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const {
        visit_status,
        visit_date,
        doctor_id,
        patient_id,
        limit = 50,
        offset = 0,
      } = req.query;

      const filters = {
        visit_status,
        visit_date,
        doctor_id,
        patient_id,
        limit,
        offset,
      };

      const visits = await visitService.listVisits(tenantId, filters);

      res.status(200).json({
        success: true,
        count: visits.length,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        data: visits,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update visit status (workflow progression)
   * PUT /api/visits/:id/status
   */
  updateStatus: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const { visit_status } = req.body;

      if (!visit_status) {
        throw new APIError("Visit status is required", 400, "BAD_REQUEST");
      }

      const result = await visitService.updateStatus(
        id,
        tenantId,
        visit_status,
        userId,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link triage record to visit
   * PUT /api/visits/:id/triage
   */
  linkTriage: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { triage_record_id } = req.body;

      if (!triage_record_id) {
        throw new APIError("Triage record ID is required", 400, "BAD_REQUEST");
      }

      const result = await visitService.linkTriageRecord(
        id,
        tenantId,
        triage_record_id,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link consultation to visit
   * PUT /api/visits/:id/consultation
   */
  linkConsultation: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { consultation_id, doctor_id } = req.body;

      if (!consultation_id || !doctor_id) {
        throw new APIError(
          "Consultation ID and Doctor ID are required",
          400,
          "BAD_REQUEST",
        );
      }

      const result = await visitService.linkConsultation(
        id,
        tenantId,
        consultation_id,
        doctor_id,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link lab request to visit
   * PUT /api/visits/:id/lab
   */
  linkLabRequest: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { lab_request_id } = req.body;

      if (!lab_request_id) {
        throw new APIError("Lab request ID is required", 400, "BAD_REQUEST");
      }

      const result = await visitService.linkLabRequest(
        id,
        tenantId,
        lab_request_id,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link prescription to visit
   * PUT /api/visits/:id/prescription
   */
  linkPrescription: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { prescription_id } = req.body;

      if (!prescription_id) {
        throw new APIError("Prescription ID is required", 400, "BAD_REQUEST");
      }

      const result = await visitService.linkPrescription(
        id,
        tenantId,
        prescription_id,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link invoice to visit
   * PUT /api/visits/:id/invoice
   */
  linkInvoice: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { invoice_id, total_amount } = req.body;

      if (!invoice_id || !total_amount) {
        throw new APIError(
          "Invoice ID and total amount are required",
          400,
          "BAD_REQUEST",
        );
      }

      const result = await visitService.linkInvoice(
        id,
        tenantId,
        invoice_id,
        total_amount,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Record payment for visit
   * POST /api/visits/:id/payment
   */
  recordPayment: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { amount_paid } = req.body;

      if (!amount_paid || parseFloat(amount_paid) <= 0) {
        throw new APIError(
          "Valid payment amount is required",
          400,
          "BAD_REQUEST",
        );
      }

      const result = await visitService.recordPayment(
        id,
        tenantId,
        amount_paid,
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Close visit
   * POST /api/visits/:id/close
   */
  closeVisit: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const result = await visitService.closeVisit(id, tenantId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get visit summary/timeline
   * GET /api/visits/:id/summary
   */
  getVisitSummary: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const result = await visitService.getVisitSummary(id, tenantId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all valid visit statuses
   * GET /api/visits/statuses/list
   */
  getValidStatuses: async (req, res, next) => {
    try {
      const statuses = visitService.getValidStatuses();

      res.status(200).json({
        success: true,
        count: statuses.length,
        data: statuses,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = visitController;
