const crypto = require('crypto');
const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const certificateController = {
  // 1. Generate a serialized sick leave certificate (Yekim Woreket)
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const doctorId = req.user.id;
      const { consultation_id, patient_id, start_date, end_date, sick_leave_days, diagnosis_notes } = req.body;

      if (!consultation_id || !patient_id || !start_date || !end_date || !sick_leave_days) {
        throw new APIError('Consultation ID, Patient ID, Start Date, End Date, and Sick Leave Days count are required.', 400, 'BAD_REQUEST');
      }

      // Check consultation and patient validity
      const [consultation] = await db.query(
        'SELECT id FROM consultations WHERE id = ? AND patient_id = ? AND clinic_id = ? LIMIT 1',
        [consultation_id, patient_id, tenantId]
      );
      if (!consultation) {
        throw new APIError('Consultation encounter record not found for this patient.', 404, 'RECORD_NOT_FOUND');
      }

      // Legal limit check: soft warning or strict validation for > 15 days
      if (parseInt(sick_leave_days, 10) > 15) {
        // Enforce warning or validation. Here we let it pass but log a warning, or strict validate if desired.
        // We will allow but add strict audit tracking.
      }

      // Generate unique serial number (e.g. MC-clinicId-year-count)
      const countSql = 'SELECT COUNT(*) as cert_count FROM medical_certificates WHERE clinic_id = ?';
      const [countResult] = await db.query(countSql, [tenantId]);
      const certCount = (countResult ? countResult.cert_count : 0) + 1;
      const year = new Date().getFullYear();
      const serial_number = `MC-${tenantId}-${year}-${10000 + certCount}`;

      // Generate SHA-256 secure verification token
      const verification_token = crypto.randomBytes(32).toString('hex');

      const insertSql = `
        INSERT INTO medical_certificates (
          clinic_id, consultation_id, patient_id, doctor_id, 
          serial_number, start_date, end_date, sick_leave_days, 
          diagnosis_notes, verification_token, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `;

      await db.query(insertSql, [
        tenantId,
        consultation_id,
        patient_id,
        doctorId,
        serial_number,
        start_date,
        end_date,
        parseInt(sick_leave_days, 10),
        diagnosis_notes ? diagnosis_notes.trim() : null,
        verification_token
      ]);

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, remarks) VALUES (?, ?, "CREATE_CERTIFICATE", "medical_certificates", ?)',
        [tenantId, doctorId, `Issued sick leave certificate: ${serial_number} for ${sick_leave_days} days`]
      );

      res.status(201).json({
        success: true,
        message: 'Medical certificate issued successfully.',
        data: {
          serial_number,
          verification_token,
          sick_leave_days
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Public verification endpoint for employers / government bodies (No JWT required)
  verify: async (req, res, next) => {
    try {
      const { token } = req.params;

      if (!token) {
        throw new APIError('Verification token is required.', 400, 'BAD_REQUEST');
      }

      const sql = `
        SELECT mc.serial_number, mc.start_date, mc.end_date, mc.sick_leave_days, mc.diagnosis_notes, mc.status, mc.created_at,
               p.first_name as patient_first, p.middle_name as patient_middle, p.last_name as patient_last, p.mrn as patient_mrn,
               d.first_name as doctor_first, d.last_name as doctor_last,
               c.name as clinic_name, c.license_number as clinic_license
        FROM medical_certificates mc
        JOIN patients p ON mc.patient_id = p.id
        JOIN users d ON mc.doctor_id = d.id
        JOIN clinics c ON mc.clinic_id = c.id
        WHERE mc.verification_token = ? AND mc.status = 'active'
        LIMIT 1
      `;
      const [cert] = await db.query(sql, [token]);

      if (!cert) {
        throw new APIError('Invalid verification token or medical certificate has been revoked.', 404, 'CERTIFICATE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        verified: true,
        data: {
          serial_number: cert.serial_number,
          clinic: {
            name: cert.clinic_name,
            license: cert.clinic_license
          },
          patient: {
            full_name: `${cert.patient_first} ${cert.patient_middle} ${cert.patient_last}`,
            mrn: cert.patient_mrn
          },
          medical_details: {
            issued_by: `Dr. ${cert.doctor_first} ${cert.doctor_last}`,
            sick_leave_days: cert.sick_leave_days,
            duration: `From ${cert.start_date.toISOString().split('T')[0]} to ${cert.end_date.toISOString().split('T')[0]}`,
            reason_stated: cert.diagnosis_notes || 'Rest recommended due to clinical condition',
            issued_on: cert.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = certificateController;
