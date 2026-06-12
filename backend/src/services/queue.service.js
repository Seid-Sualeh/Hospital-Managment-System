const db = require("../config/db");
const { APIError } = require("../middlewares/error");

const QUEUE_TYPES = ["CONSULTATION", "LABORATORY", "PHARMACY"];
const QUEUE_STATUSES = ["WAITING", "IN_SERVICE", "COMPLETED", "CANCELLED"];

const queueService = {
  validateQueueType: (queueType) => {
    if (!QUEUE_TYPES.includes(queueType)) {
      throw new APIError(
        `Invalid queue type: ${queueType}`,
        400,
        "INVALID_QUEUE_TYPE",
      );
    }
  },

  createQueueEntry: async (visitId, clinicId, queueType, assignedTo = null) => {
    try {
      queueService.validateQueueType(queueType);

      const [existing] = await db.query(
        "SELECT id, status FROM queue_entries WHERE visit_id = ? AND clinic_id = ? AND queue_type = ? AND status IN (?, ?) LIMIT 1",
        [visitId, clinicId, queueType, "WAITING", "IN_SERVICE"],
      );

      if (existing) {
        return {
          queueId: existing.id,
          status: existing.status,
          message: "Queue entry already exists for this visit and queue type",
        };
      }

      const [countResult] = await db.query(
        "SELECT COUNT(*) AS count FROM queue_entries WHERE clinic_id = ? AND queue_type = ? AND status = ?",
        [clinicId, queueType, "WAITING"],
      );

      const queuePosition =
        (countResult && countResult.count
          ? parseInt(countResult.count, 10)
          : 0) + 1;

      const insertSql = `
        INSERT INTO queue_entries (
          clinic_id, visit_id, queue_type, queue_position, assigned_to, status
        ) VALUES (?, ?, ?, ?, ?, 'WAITING')
      `;

      const result = await db.query(insertSql, [
        clinicId,
        visitId,
        queueType,
        queuePosition,
        assignedTo,
      ]);

      return {
        queueId: result.insertId,
        queuePosition,
        queueType,
        status: "WAITING",
        message: "Queue entry created successfully",
      };
    } catch (error) {
      throw error;
    }
  },

  getQueueByType: async (clinicId, queueType) => {
    try {
      queueService.validateQueueType(queueType);

      const sql = `
        SELECT qe.*, v.visit_status, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
               p.mrn AS patient_mrn, u.first_name AS doctor_first_name, u.last_name AS doctor_last_name
        FROM queue_entries qe
        JOIN visits v ON qe.visit_id = v.id
        JOIN patients p ON v.patient_id = p.id
        LEFT JOIN users u ON qe.assigned_to = u.id
        WHERE qe.clinic_id = ? AND qe.queue_type = ?
        ORDER BY qe.queue_position ASC, qe.created_at ASC
      `;

      const queue = await db.query(sql, [clinicId, queueType]);
      return queue;
    } catch (error) {
      throw error;
    }
  },

  updateQueueEntryStatus: async (
    entryId,
    clinicId,
    newStatus,
    assignedTo = null,
  ) => {
    try {
      if (!QUEUE_STATUSES.includes(newStatus)) {
        throw new APIError(
          `Invalid queue status: ${newStatus}`,
          400,
          "INVALID_QUEUE_STATUS",
        );
      }

      const [entry] = await db.query(
        "SELECT * FROM queue_entries WHERE id = ? AND clinic_id = ? LIMIT 1",
        [entryId, clinicId],
      );

      if (!entry) {
        throw new APIError(
          "Queue entry not found",
          404,
          "QUEUE_ENTRY_NOT_FOUND",
        );
      }

      const updateFields = [newStatus, entryId, clinicId];
      let sql = "UPDATE queue_entries SET status = ?, updated_at = NOW()";

      if (assignedTo !== null) {
        sql += ", assigned_to = ?";
        updateFields.splice(2, 0, assignedTo);
      }

      if (newStatus === "IN_SERVICE" && !entry.service_start_time) {
        sql += ", service_start_time = NOW()";
      }

      if (newStatus === "COMPLETED" && !entry.service_end_time) {
        sql += ", service_end_time = NOW()";
      }

      sql += " WHERE id = ? AND clinic_id = ?";

      await db.query(sql, updateFields);

      return {
        queueId: entryId,
        newStatus,
        message: "Queue entry status updated",
      };
    } catch (error) {
      throw error;
    }
  },

  updateQueueEntryStatusByVisit: async (
    visitId,
    clinicId,
    queueType,
    newStatus,
  ) => {
    try {
      queueService.validateQueueType(queueType);

      if (!QUEUE_STATUSES.includes(newStatus)) {
        throw new APIError(
          `Invalid queue status: ${newStatus}`,
          400,
          "INVALID_QUEUE_STATUS",
        );
      }

      const [entry] = await db.query(
        "SELECT * FROM queue_entries WHERE visit_id = ? AND clinic_id = ? AND queue_type = ? AND status IN (?, ?) ORDER BY created_at ASC LIMIT 1",
        [visitId, clinicId, queueType, "WAITING", "IN_SERVICE"],
      );

      if (!entry) {
        throw new APIError(
          "Queue entry for visit not found",
          404,
          "QUEUE_ENTRY_NOT_FOUND",
        );
      }

      return queueService.updateQueueEntryStatus(entry.id, clinicId, newStatus);
    } catch (error) {
      throw error;
    }
  },

  completeQueueEntriesForVisit: async (visitId, clinicId, queueType = null) => {
    try {
      let sql = `
        UPDATE queue_entries
        SET status = 'COMPLETED', service_end_time = COALESCE(service_end_time, NOW()), updated_at = NOW()
        WHERE visit_id = ? AND clinic_id = ? AND status IN ('WAITING', 'IN_SERVICE')
      `;
      const params = [visitId, clinicId];

      if (queueType) {
        queueService.validateQueueType(queueType);
        sql += " AND queue_type = ?";
        params.push(queueType);
      }

      await db.query(sql, params);
      return {
        visitId,
        queueType,
        message: queueType
          ? "Queue entries completed for visit and type"
          : "Queue entries completed for visit",
      };
    } catch (error) {
      throw error;
    }
  },

  listAllQueues: async (clinicId, status = null) => {
    try {
      let sql = `
        SELECT qe.*, v.visit_status, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
               p.mrn AS patient_mrn, u.first_name AS doctor_first_name, u.last_name AS doctor_last_name
        FROM queue_entries qe
        JOIN visits v ON qe.visit_id = v.id
        JOIN patients p ON v.patient_id = p.id
        LEFT JOIN users u ON qe.assigned_to = u.id
        WHERE qe.clinic_id = ?
      `;
      const params = [clinicId];

      if (status) {
        sql += " AND qe.status = ?";
        params.push(status);
      }

      sql +=
        " ORDER BY qe.queue_type ASC, qe.queue_position ASC, qe.created_at ASC";
      const queue = await db.query(sql, params);
      return queue;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = queueService;
