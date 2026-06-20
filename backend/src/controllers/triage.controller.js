const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const triageController = {
  // 1. Create a new triage vitals record
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const nurseId = req.user.id;
      const {
        patient_id,
        temperature,
        blood_pressure_sys,
        blood_pressure_dia,
        pulse_rate,
        respiratory_rate,
        oxygen_saturation,
        weight,
        height,
        triage_level
      } = req.body;

      if (!patient_id) {
        throw new APIError('Patient ID is required.', 400, 'BAD_REQUEST');
      }

      // Check if patient exists
      const [patient] = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patient_id, tenantId]);
      if (!patient) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      // Compute BMI if weight and height are provided (weight in kg, height in cm)
      let bmi = null;
      if (weight && height) {
        const heightMeters = parseFloat(height) / 100;
        bmi = parseFloat((parseFloat(weight) / (heightMeters * heightMeters)).toFixed(1));
      }

      const sql = `
        INSERT INTO triage_records (
          clinic_id, patient_id, nurse_id, temperature, 
          blood_pressure_sys, blood_pressure_dia, pulse_rate, 
          respiratory_rate, oxygen_saturation, weight, height, bmi, triage_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(sql, [
        tenantId,
        patient_id,
        nurseId,
        temperature || null,
        blood_pressure_sys || null,
        blood_pressure_dia || null,
        pulse_rate || null,
        respiratory_rate || null,
        oxygen_saturation || null,
        weight || null,
        height || null,
        bmi,
        triage_level || 'green'
      ]);

      // Set appointment status to 'checked_in' if scheduled
      await db.query(
        'UPDATE appointments SET status = "checked_in" WHERE patient_id = ? AND clinic_id = ? AND status = "scheduled" ORDER BY appointment_datetime DESC LIMIT 1',
        [patient_id, tenantId]
      );

      // Audit Log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'WRITE_VITALS', 'triage_records', ?)",
        [tenantId, nurseId, result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Triage vitals recorded successfully.',
        data: {
          id: result.insertId,
          bmi
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Fetch vitals history for a specific patient
  getHistory: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.patientId;

      const sql = `
        SELECT tr.*, u.first_name as nurse_first, u.last_name as nurse_last
        FROM triage_records tr
        JOIN users u ON tr.nurse_id = u.id
        WHERE tr.patient_id = ? AND tr.clinic_id = ?
        ORDER BY tr.created_at DESC
      `;
      const records = await db.query(sql, [patientId, tenantId]);

      res.status(200).json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = triageController;
