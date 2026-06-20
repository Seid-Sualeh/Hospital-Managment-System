const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const appointmentController = {
  // 1. List appointments with doctor and date filters
  list: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { doctor_id, date, status } = req.query;

      let sql = `
        SELECT a.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn as patient_mrn,
               u.first_name as doctor_first_name, u.last_name as doctor_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON a.doctor_id = u.id
        WHERE a.clinic_id = ?
      `;
      const params = [tenantId];

      if (doctor_id) {
        sql += ' AND a.doctor_id = ?';
        params.push(doctor_id);
      }

      if (date) {
        // Enforces date format filtering (YYYY-MM-DD)
        sql += ' AND DATE(a.appointment_datetime) = ?';
        params.push(date);
      }

      if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY a.appointment_datetime ASC';

      const appointments = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Create a new appointment slot
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const { patient_id, doctor_id, appointment_datetime, reason_for_visit } = req.body;

      if (!patient_id || !doctor_id || !appointment_datetime) {
        throw new APIError('Patient ID, Doctor ID, and Appointment Date/Time are required.', 400, 'BAD_REQUEST');
      }

      // Check if patient belongs to this clinic
      const [patient] = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patient_id, tenantId]);
      if (!patient) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      // Check if doctor belongs to this clinic and has correct role
      const [doctor] = await db.query('SELECT id FROM users WHERE id = ? AND clinic_id = ? LIMIT 1', [doctor_id, tenantId]);
      if (!doctor) {
        throw new APIError('Doctor not found inside this clinic context.', 404, 'DOCTOR_NOT_FOUND');
      }

      const insertSql = `
        INSERT INTO appointments (
          clinic_id, patient_id, doctor_id, appointment_datetime, reason_for_visit, status
        ) VALUES (?, ?, ?, ?, ?, 'scheduled')
      `;
      const result = await db.query(insertSql, [
        tenantId,
        patient_id,
        doctor_id,
        appointment_datetime,
        reason_for_visit ? reason_for_visit.trim() : null
      ]);

      const appointmentId = result.insertId;

      // Audit Log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'CREATE_APPOINTMENT', 'appointments', ?)",
        [tenantId, actorId, appointmentId]
      );

      res.status(201).json({
        success: true,
        message: 'Appointment scheduled successfully.',
        appointmentId
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Reschedule an existing appointment datetime
  reschedule: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const appointmentId = req.params.id;
      const actorId = req.user.id;
      const { appointment_datetime } = req.body;

      if (!appointment_datetime) {
        throw new APIError('New Appointment Date/Time is required.', 400, 'BAD_REQUEST');
      }

      // Check existence
      const [appointment] = await db.query('SELECT id, appointment_datetime FROM appointments WHERE id = ? AND clinic_id = ? LIMIT 1', [appointmentId, tenantId]);
      if (!appointment) {
        throw new APIError('Appointment slot not found.', 404, 'APPOINTMENT_NOT_FOUND');
      }

      const updateSql = 'UPDATE appointments SET appointment_datetime = ?, status = "scheduled" WHERE id = ? AND clinic_id = ?';
      await db.query(updateSql, [appointment_datetime, appointmentId, tenantId]);

      // Audit
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, old_values, new_values) VALUES (?, ?, 'RESCHEDULE_APPOINTMENT', 'appointments', ?, ?, ?)",
        [
          tenantId, 
          actorId, 
          appointmentId, 
          JSON.stringify({ appointment_datetime: appointment.appointment_datetime }), 
          JSON.stringify({ appointment_datetime })
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Cancel appointment status
  cancel: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const appointmentId = req.params.id;
      const actorId = req.user.id;

      // Check existence
      const [appointment] = await db.query('SELECT id FROM appointments WHERE id = ? AND clinic_id = ? LIMIT 1', [appointmentId, tenantId]);
      if (!appointment) {
        throw new APIError('Appointment slot not found.', 404, 'APPOINTMENT_NOT_FOUND');
      }

      const updateSql = 'UPDATE appointments SET status = "cancelled" WHERE id = ? AND clinic_id = ?';
      await db.query(updateSql, [appointmentId, tenantId]);

      // Audit
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, 'CANCEL_APPOINTMENT', 'appointments', ?, 'Status toggled to cancelled')",
        [tenantId, actorId, appointmentId]
      );

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Update appointment overall triage status (e.g. check-in, completed)
  updateStatus: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const appointmentId = req.params.id;
      const actorId = req.user.id;
      const { status } = req.body;

      const validStatuses = ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'];
      if (!status || !validStatuses.includes(status)) {
        throw new APIError('Provide a valid status state.', 400, 'BAD_REQUEST');
      }

      const [appointment] = await db.query('SELECT id FROM appointments WHERE id = ? AND clinic_id = ? LIMIT 1', [appointmentId, tenantId]);
      if (!appointment) {
        throw new APIError('Appointment record not found.', 404, 'APPOINTMENT_NOT_FOUND');
      }

      await db.query('UPDATE appointments SET status = ? WHERE id = ? AND clinic_id = ?', [status, appointmentId, tenantId]);

      // Audit
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, 'UPDATE_APPOINTMENT_STATUS', 'appointments', ?, ?)",
        [tenantId, actorId, appointmentId, `Status updated to ${status}`]
      );

      res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}.`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = appointmentController;
