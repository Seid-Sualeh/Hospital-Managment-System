const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const visitService = require('../services/visit.service');

const consultationController = {
  // Document a new EMR Consultation
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const doctorId = req.user.id; // Logged-in user
      const {
        patient_id,
        visit_id,
        appointment_id,
        vitals,
        chief_complaints,
        history_of_present_illness,
        physical_examination,
        diagnoses,
        clinical_notes,
        prescriptions,  // Array of medicine objects: [{medicine_id, name, dosage, frequency, duration}]
        lab_tests,      // Array of test string names: ["CBC", "Widal Test"]
        status = 'completed'
      } = req.body;

      if (!patient_id || !chief_complaints) {
        throw new APIError('Patient ID and Chief Complaints are required fields.', 400, 'BAD_REQUEST');
      }

      // Check if patient exists in this tenant
      const patientCheck = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patient_id, tenantId]);
      if (!patientCheck || patientCheck.length === 0) {
        throw new APIError('Invalid Patient ID. Record does not belong to this clinic.', 404, 'PATIENT_NOT_FOUND');
      }

      // 1. Insert consultation record
      const insertSql = `
        INSERT INTO consultations (
          clinic_id, appointment_id, patient_id, doctor_id, consultation_datetime,
          vitals, chief_complaints, history_of_present_illness, physical_examination,
          diagnoses, clinical_notes, status
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        tenantId,
        appointment_id || null,
        patient_id,
        doctorId,
        vitals ? JSON.stringify(vitals) : null,
        chief_complaints.trim(),
        history_of_present_illness ? history_of_present_illness.trim() : null,
        physical_examination ? physical_examination.trim() : null,
        diagnoses ? JSON.stringify(diagnoses) : null,
        clinical_notes ? clinical_notes.trim() : null,
        status
      ];

      const result = await db.query(insertSql, params);
      const consultationId = result.insertId;

      let prescriptionId = null;
      // 2. Transactional addition of Prescription if provided
      if (prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0) {
        const presSql = `
          INSERT INTO prescriptions (
            clinic_id, consultation_id, patient_id, doctor_id, prescribed_date, instructions, status
          ) VALUES (?, ?, ?, ?, CURDATE(), ?, 'pending')
        `;
        const presResult = await db.query(presSql, [
          tenantId,
          consultationId,
          patient_id,
          doctorId,
          JSON.stringify(prescriptions)
        ]);
        prescriptionId = presResult.insertId;
      }

      let labRequestId = null;
      // 3. Transactional addition of Lab Request panel if ordered
      if (lab_tests && Array.isArray(lab_tests) && lab_tests.length > 0) {
        const labSql = `
          INSERT INTO lab_requests (
            clinic_id, consultation_id, patient_id, doctor_id, request_date, test_names, status
          ) VALUES (?, ?, ?, ?, NOW(), ?, 'ordered')
        `;
        const labResult = await db.query(labSql, [
          tenantId,
          consultationId,
          patient_id,
          doctorId,
          JSON.stringify(lab_tests)
        ]);
        labRequestId = labResult.insertId;
      }

      // 4. Update corresponding appointment status to 'completed'
      if (appointment_id) {
        await db.query('UPDATE appointments SET status = "completed" WHERE id = ?', [appointment_id]);
      }

      // 5. Link records to visit and automate status transitions if visit_id is provided
      if (visit_id) {
        await visitService.linkConsultation(visit_id, tenantId, consultationId, doctorId);
        
        if (labRequestId) {
          await visitService.linkLabRequest(visit_id, tenantId, labRequestId);
        }
        if (prescriptionId) {
          await visitService.linkPrescription(visit_id, tenantId, prescriptionId);
        }

        // Automate visit status workflow transition
        if (labRequestId) {
          await visitService.updateStatus(visit_id, tenantId, 'LAB_PAYMENT_PENDING', doctorId);
        } else if (prescriptionId) {
          await visitService.updateStatus(visit_id, tenantId, 'PRESCRIPTION_CREATED', doctorId);
          await visitService.updateStatus(visit_id, tenantId, 'MEDICATION_PAYMENT_PENDING', doctorId);
        } else {
          await visitService.updateStatus(visit_id, tenantId, 'CLOSED', doctorId);
        }
      }

      // HIPAA/Compliance Security Rule: Add audit trail log entry for EMR access
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const auditSql = `
        INSERT INTO audit_logs (
          clinic_id, user_id, action_type, affected_table, affected_record_id, new_values, ip_address, user_agent
        ) VALUES (?, ?, 'CREATE_EMR', 'consultations', ?, ?, ?, ?)
      `;
      await db.query(auditSql, [
        tenantId,
        doctorId,
        consultationId,
        JSON.stringify({ patient_id, chief_complaints, diagnoses }),
        ip,
        userAgent
      ]);

      res.status(201).json({
        success: true,
        message: 'EMR consultation recorded successfully.',
        consultationId
      });
    } catch (error) {
      next(error);
    }
  },

  // Retrieve patient history listing
  listByPatient: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.patientId;
      const doctorId = req.user.id;

      // Verify patient tenant scope
      const patientCheck = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patient_id, tenantId]);
      if (!patientCheck || patientCheck.length === 0) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      const sql = `
        SELECT c.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
        FROM consultations c
        JOIN users u ON c.doctor_id = u.id
        WHERE c.patient_id = ? AND c.clinic_id = ?
        ORDER BY c.consultation_datetime DESC
      `;
      const consultations = await db.query(sql, [patientId, tenantId]);

      // HIPAA Security: Audit read action on patient history
      const ip = req.ip || req.headers['x-forwarded-for'];
      const auditSql = `
        INSERT INTO audit_logs (
          clinic_id, user_id, action_type, affected_table, affected_record_id, ip_address
        ) VALUES (?, ?, 'VIEW_EMR_HISTORY', 'patients', ?, ?)
      `;
      await db.query(auditSql, [tenantId, doctorId, patientId, ip]);

      res.status(200).json({
        success: true,
        data: consultations
      });
    } catch (error) {
      next(error);
    }
  },

  // Fetch consultation detailed encounter logs by ID
  getById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const consultationId = req.params.id;
      const doctorId = req.user.id;

      const sql = `
        SELECT c.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name,
               p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn as patient_mrn
        FROM consultations c
        JOIN users u ON c.doctor_id = u.id
        JOIN patients p ON c.patient_id = p.id
        WHERE c.id = ? AND c.clinic_id = ?
        LIMIT 1
      `;
      const results = await db.query(sql, [consultationId, tenantId]);

      if (!results || results.length === 0) {
        throw new APIError('Consultation record not found.', 404, 'EMR_NOT_FOUND');
      }

      // Security Logging
      const ip = req.ip || req.headers['x-forwarded-for'];
      const auditSql = `
        INSERT INTO audit_logs (
          clinic_id, user_id, action_type, affected_table, affected_record_id, ip_address
        ) VALUES (?, ?, 'VIEW_EMR_DETAIL', 'consultations', ?, ?)
      `;
      await db.query(auditSql, [tenantId, doctorId, consultationId, ip]);

      res.status(200).json({
        success: true,
        data: results[0]
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = consultationController;
