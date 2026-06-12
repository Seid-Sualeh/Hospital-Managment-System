const db = require("../config/db");
const { APIError } = require("../middlewares/error");
const queueService = require("./queue.service");

const visitService = {
  /**
   * Create a new visit (Registration)
   */
  create: async (patientId, clinicId, createdById, reasonForVisit = null) => {
    try {
      const sql = `
        INSERT INTO visits (
          clinic_id, patient_id, created_by, visit_date, visit_status, reason_for_visit
        ) VALUES (?, ?, ?, CURDATE(), 'REGISTERED', ?)
      `;

      const result = await db.query(sql, [
        clinicId,
        patientId,
        createdById,
        reasonForVisit,
      ]);

      return {
        visitId: result.insertId,
        status: "REGISTERED",
        message: "Visit registered successfully",
      };
    } catch (error) {
      throw new APIError(
        `Failed to create visit: ${error.message}`,
        500,
        "VISIT_CREATION_ERROR",
      );
    }
  },

  /**
   * Get visit by ID
   */
  getById: async (visitId, clinicId) => {
    try {
      const [visit] = await db.query(
        "SELECT * FROM visits WHERE id = ? AND clinic_id = ? LIMIT 1",
        [visitId, clinicId],
      );

      if (!visit) {
        throw new APIError("Visit not found", 404, "VISIT_NOT_FOUND");
      }

      return visit;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all visits for a patient
   */
  getByPatientId: async (patientId, clinicId) => {
    try {
      const visits = await db.query(
        "SELECT * FROM visits WHERE patient_id = ? AND clinic_id = ? ORDER BY visit_date DESC",
        [patientId, clinicId],
      );

      return visits;
    } catch (error) {
      throw new APIError(
        `Failed to fetch patient visits: ${error.message}`,
        500,
        "VISIT_FETCH_ERROR",
      );
    }
  },

  /**
   * Get all visits for a clinic with optional filters
   */
  listVisits: async (clinicId, filters = {}) => {
    try {
      let sql = `
        SELECT v.*, 
               p.first_name as patient_first_name, 
               p.last_name as patient_last_name,
               p.mrn as patient_mrn,
               u.first_name as doctor_first_name,
               u.last_name as doctor_last_name,
               cr.first_name as created_by_first_name,
               cr.last_name as created_by_last_name
        FROM visits v
        JOIN patients p ON v.patient_id = p.id
        LEFT JOIN users u ON v.doctor_id = u.id
        LEFT JOIN users cr ON v.created_by = cr.id
        WHERE v.clinic_id = ?
      `;
      const params = [clinicId];

      // Optional filters
      if (filters.visit_status) {
        sql += " AND v.visit_status = ?";
        params.push(filters.visit_status);
      }

      if (filters.visit_date) {
        sql += " AND DATE(v.visit_date) = ?";
        params.push(filters.visit_date);
      }

      if (filters.doctor_id) {
        sql += " AND v.doctor_id = ?";
        params.push(filters.doctor_id);
      }

      if (filters.patient_id) {
        sql += " AND v.patient_id = ?";
        params.push(filters.patient_id);
      }

      sql += " ORDER BY v.visit_date DESC LIMIT ? OFFSET ?";
      params.push(
        parseInt(filters.limit || 50, 10),
        parseInt(filters.offset || 0, 10),
      );

      const visits = await db.query(sql, params);
      return visits;
    } catch (error) {
      throw new APIError(
        `Failed to list visits: ${error.message}`,
        500,
        "VISIT_LIST_ERROR",
      );
    }
  },

  /**
   * Update visit status (workflow progression)
   */
  updateStatus: async (visitId, clinicId, newStatus, userId) => {
    try {
      // Validate status
      const validStatuses = [
        "REGISTERED",
        "CONSULTATION_PAID",
        "WAITING_DOCTOR",
        "LAB_PAYMENT_PENDING",
        "LAB_PAID",
        "IN_LABORATORY",
        "LAB_COMPLETED",
        "PRESCRIPTION_CREATED",
        "MEDICATION_PAYMENT_PENDING",
        "MEDICATION_PAID",
        "DISPENSED",
        "CLOSED",
      ];

      if (!validStatuses.includes(newStatus)) {
        throw new APIError(
          `Invalid visit status: ${newStatus}`,
          400,
          "INVALID_STATUS",
        );
      }

      // Get current visit
      const visit = await visitService.getById(visitId, clinicId);

      // Check valid transition logic
      const validTransitions = {
        REGISTERED: ["CONSULTATION_PAID", "CLOSED"],
        CONSULTATION_PAID: ["WAITING_DOCTOR", "CLOSED"],
        WAITING_DOCTOR: [
          "LAB_PAYMENT_PENDING",
          "PRESCRIPTION_CREATED",
          "CLOSED",
        ],
        LAB_PAYMENT_PENDING: ["LAB_PAID", "CLOSED"],
        LAB_PAID: ["IN_LABORATORY", "CLOSED"],
        IN_LABORATORY: ["LAB_COMPLETED", "CLOSED"],
        LAB_COMPLETED: ["PRESCRIPTION_CREATED", "CLOSED"],
        PRESCRIPTION_CREATED: ["MEDICATION_PAYMENT_PENDING", "CLOSED"],
        MEDICATION_PAYMENT_PENDING: ["MEDICATION_PAID", "CLOSED"],
        MEDICATION_PAID: ["DISPENSED", "CLOSED"],
        DISPENSED: ["CLOSED"],
        CLOSED: [],
      };

      // Validate transition
      if (
        !validTransitions[visit.visit_status] ||
        !validTransitions[visit.visit_status].includes(newStatus)
      ) {
        throw new APIError(
          `Cannot transition from ${visit.visit_status} to ${newStatus}`,
          400,
          "INVALID_TRANSITION",
        );
      }

      // Update visit status
      const sql = `
        UPDATE visits 
        SET visit_status = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [newStatus, visitId, clinicId]);

      // Sync queue state after status change
      await visitService.syncQueueState(
        visitId,
        clinicId,
        visit.visit_status,
        newStatus,
      );

      // Log the transition in audit logs
      const auditSql = `
        INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, old_values, new_values)
        VALUES (?, ?, 'UPDATE_VISIT_STATUS', 'visits', ?, ?, ?)
      `;

      await db.query(auditSql, [
        clinicId,
        userId,
        visitId,
        JSON.stringify({ visit_status: visit.visit_status }),
        JSON.stringify({ visit_status: newStatus }),
      ]);

      return {
        visitId,
        oldStatus: visit.visit_status,
        newStatus,
        message: `Visit status updated from ${visit.visit_status} to ${newStatus}`,
      };
    } catch (error) {
      throw error;
    }
  },

  syncQueueState: async (visitId, clinicId, oldStatus, newStatus) => {
    try {
      const actions = [];

      if (newStatus === "WAITING_DOCTOR") {
        actions.push(() =>
          queueService.createQueueEntry(visitId, clinicId, "CONSULTATION"),
        );
      }

      if (newStatus === "LAB_PAYMENT_PENDING" || newStatus === "PRESCRIPTION_CREATED") {
        actions.push(() =>
          queueService.completeQueueEntriesForVisit(visitId, clinicId, "CONSULTATION"),
        );
      }

      if (newStatus === "LAB_PAID") {
        actions.push(() =>
          queueService.createQueueEntry(visitId, clinicId, "LABORATORY"),
        );
      }

      if (newStatus === "IN_LABORATORY") {
        actions.push(() =>
          queueService.updateQueueEntryStatusByVisit(
            visitId,
            clinicId,
            "LABORATORY",
            "IN_SERVICE",
          ),
        );
      }

      if (newStatus === "LAB_COMPLETED") {
        actions.push(() =>
          queueService.completeQueueEntriesForVisit(
            visitId,
            clinicId,
            "LABORATORY",
          ),
        );
        actions.push(() =>
          queueService.createQueueEntry(visitId, clinicId, "CONSULTATION"),
        );
      }

      if (newStatus === "MEDICATION_PAID") {
        actions.push(() =>
          queueService.createQueueEntry(visitId, clinicId, "PHARMACY"),
        );
      }

      if (newStatus === "DISPENSED") {
        actions.push(() =>
          queueService.completeQueueEntriesForVisit(
            visitId,
            clinicId,
            "PHARMACY",
          ),
        );
      }

      if (newStatus === "CLOSED") {
        actions.push(() =>
          queueService.completeQueueEntriesForVisit(visitId, clinicId),
        );
      }

      for (const action of actions) {
        await action();
      }

      return true;
    } catch (error) {
      // Ignore queue sync failures to avoid blocking valid status updates, but log if needed
      console.warn(
        "Queue sync failed for visit",
        visitId,
        error.message || error,
      );
      return false;
    }
  },

  /**
   * Link triage record to visit
   */
  linkTriageRecord: async (visitId, clinicId, triageRecordId) => {
    try {
      const sql = `
        UPDATE visits 
        SET triage_record_id = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [triageRecordId, visitId, clinicId]);

      return {
        visitId,
        triageRecordId,
        message: "Triage record linked to visit",
      };
    } catch (error) {
      throw new APIError(
        `Failed to link triage record: ${error.message}`,
        500,
        "LINK_TRIAGE_ERROR",
      );
    }
  },

  /**
   * Link consultation to visit
   */
  linkConsultation: async (visitId, clinicId, consultationId, doctorId) => {
    try {
      const sql = `
        UPDATE visits 
        SET consultation_id = ?, doctor_id = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [consultationId, doctorId, visitId, clinicId]);

      return {
        visitId,
        consultationId,
        doctorId,
        message: "Consultation linked to visit",
      };
    } catch (error) {
      throw new APIError(
        `Failed to link consultation: ${error.message}`,
        500,
        "LINK_CONSULTATION_ERROR",
      );
    }
  },

  /**
   * Link lab request to visit
   */
  linkLabRequest: async (visitId, clinicId, labRequestId) => {
    try {
      const sql = `
        UPDATE visits 
        SET lab_request_id = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [labRequestId, visitId, clinicId]);

      return {
        visitId,
        labRequestId,
        message: "Lab request linked to visit",
      };
    } catch (error) {
      throw new APIError(
        `Failed to link lab request: ${error.message}`,
        500,
        "LINK_LAB_ERROR",
      );
    }
  },

  /**
   * Link prescription to visit
   */
  linkPrescription: async (visitId, clinicId, prescriptionId) => {
    try {
      const sql = `
        UPDATE visits 
        SET prescription_id = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [prescriptionId, visitId, clinicId]);

      return {
        visitId,
        prescriptionId,
        message: "Prescription linked to visit",
      };
    } catch (error) {
      throw new APIError(
        `Failed to link prescription: ${error.message}`,
        500,
        "LINK_PRESCRIPTION_ERROR",
      );
    }
  },

  /**
   * Link invoice to visit
   */
  linkInvoice: async (visitId, clinicId, invoiceId, totalAmount) => {
    try {
      const sql = `
        UPDATE visits 
        SET invoice_id = ?, total_amount = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [invoiceId, totalAmount, visitId, clinicId]);

      return {
        visitId,
        invoiceId,
        totalAmount,
        message: "Invoice linked to visit",
      };
    } catch (error) {
      throw new APIError(
        `Failed to link invoice: ${error.message}`,
        500,
        "LINK_INVOICE_ERROR",
      );
    }
  },

  /**
   * Record payment for visit
   */
  recordPayment: async (visitId, clinicId, amountPaid) => {
    try {
      const visit = await visitService.getById(visitId, clinicId);

      const newAmountPaid =
        parseFloat(visit.amount_paid || 0) + parseFloat(amountPaid);

      const sql = `
        UPDATE visits 
        SET amount_paid = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [newAmountPaid, visitId, clinicId]);

      return {
        visitId,
        amountPaid: newAmountPaid,
        totalAmount: visit.total_amount,
        balanceDue: Math.max(
          0,
          parseFloat(visit.total_amount || 0) - newAmountPaid,
        ),
        message: `Payment recorded: ${amountPaid}`,
      };
    } catch (error) {
      throw new APIError(
        `Failed to record payment: ${error.message}`,
        500,
        "PAYMENT_RECORD_ERROR",
      );
    }
  },

  /**
   * Close visit
   */
  closeVisit: async (visitId, clinicId) => {
    try {
      const visit = await visitService.getById(visitId, clinicId);

      const sql = `
        UPDATE visits 
        SET visit_status = 'CLOSED', updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(sql, [visitId, clinicId]);

      return {
        visitId,
        oldStatus: visit.visit_status,
        newStatus: "CLOSED",
        message: "Visit closed successfully",
      };
    } catch (error) {
      throw new APIError(
        `Failed to close visit: ${error.message}`,
        500,
        "VISIT_CLOSE_ERROR",
      );
    }
  },

  /**
   * Get visit timeline/summary
   */
  getVisitSummary: async (visitId, clinicId) => {
    try {
      const visit = await visitService.getById(visitId, clinicId);

      // Fetch related records
      let triage = null;
      let consultation = null;
      let labRequest = null;
      let prescription = null;
      let invoice = null;

      if (visit.triage_record_id) {
        [triage] = await db.query("SELECT * FROM triage_records WHERE id = ?", [
          visit.triage_record_id,
        ]);
      }

      if (visit.consultation_id) {
        [consultation] = await db.query(
          "SELECT * FROM consultations WHERE id = ?",
          [visit.consultation_id],
        );
      }

      if (visit.lab_request_id) {
        [labRequest] = await db.query(
          "SELECT * FROM lab_requests WHERE id = ?",
          [visit.lab_request_id],
        );
      }

      if (visit.prescription_id) {
        [prescription] = await db.query(
          "SELECT * FROM prescriptions WHERE id = ?",
          [visit.prescription_id],
        );
      }

      if (visit.invoice_id) {
        [invoice] = await db.query("SELECT * FROM invoices WHERE id = ?", [
          visit.invoice_id,
        ]);
      }

      return {
        visit,
        triage,
        consultation,
        labRequest,
        prescription,
        invoice,
        summary: {
          patientId: visit.patient_id,
          visitDate: visit.visit_date,
          currentStatus: visit.visit_status,
          doctorAssigned: visit.doctor_id ? "Yes" : "No",
          totalAmount: visit.total_amount,
          amountPaid: visit.amount_paid,
          balanceDue: Math.max(
            0,
            parseFloat(visit.total_amount || 0) -
              parseFloat(visit.amount_paid || 0),
          ),
        },
      };
    } catch (error) {
      throw new APIError(
        `Failed to fetch visit summary: ${error.message}`,
        500,
        "VISIT_SUMMARY_ERROR",
      );
    }
  },

  /**
   * Get all valid visit statuses
   */
  getValidStatuses: () => {
    return [
      "REGISTERED",
      "CONSULTATION_PAID",
      "WAITING_DOCTOR",
      "LAB_PAYMENT_PENDING",
      "LAB_PAID",
      "IN_LABORATORY",
      "LAB_COMPLETED",
      "PRESCRIPTION_CREATED",
      "MEDICATION_PAYMENT_PENDING",
      "MEDICATION_PAID",
      "DISPENSED",
      "CLOSED",
    ];
  },
};

module.exports = visitService;
