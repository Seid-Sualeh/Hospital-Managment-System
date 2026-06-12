const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const geezCalendar = require('../utils/geezCalendar');

const patientController = {
  // 1. Fetch paginated, tenant-filtered list of patients with search
  list: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { search, limit = 50, offset = 0 } = req.query;

      let sql = 'SELECT * FROM patients WHERE clinic_id = ?';
      const params = [tenantId];

      if (search) {
        sql += ' AND (first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ? OR mrn LIKE ? OR phone_number LIKE ?)';
        const searchWildcard = `%${search}%`;
        params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const patients = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: patients
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Register a new patient profile
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const {
        first_name,
        middle_name,
        last_name,
        gender,
        dob_gregorian,
        phone_number,
        sub_city,
        woreda,
        kebele,
        house_number,
        fayda_id,
        address,
        emergency_contact_name,
        emergency_contact_phone
      } = req.body;

      if (!first_name || !last_name || !gender || !dob_gregorian) {
        throw new APIError('First name, last name, gender, and Date of Birth (Gregorian) are required.', 400, 'BAD_REQUEST');
      }

      // Concurrency-safe MRN code generation for this clinic
      const countSql = 'SELECT COUNT(*) as patient_count FROM patients WHERE clinic_id = ?';
      const [countResult] = await db.query(countSql, [tenantId]);
      const baseNum = (countResult ? countResult.patient_count : 0) + 10001;
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const mrn = `MRN-${baseNum}-${randSuffix}`;

      // Automatically translate Gregorian birthdate to Ge'ez calendar presentation representation
      const dob_ethiopian = geezCalendar.toEthiopian(dob_gregorian);

      const insertSql = `
        INSERT INTO patients (
          clinic_id, mrn, first_name, middle_name, last_name, 
          gender, dob_gregorian, dob_ethiopian, phone_number, 
          sub_city, woreda, kebele, house_number, fayda_id,
          address, emergency_contact_name, emergency_contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        tenantId,
        mrn,
        first_name.trim(),
        middle_name ? middle_name.trim() : '',
        last_name.trim(),
        gender,
        dob_gregorian,
        dob_ethiopian,
        phone_number ? phone_number.trim() : null,
        sub_city ? sub_city.trim() : null,
        woreda ? woreda.trim() : null,
        kebele ? kebele.trim() : null,
        house_number ? house_number.trim() : null,
        fayda_id ? fayda_id.trim() : null,
        address ? address.trim() : null,
        emergency_contact_name ? emergency_contact_name.trim() : null,
        emergency_contact_phone ? emergency_contact_phone.trim() : null
      ];

      const result = await db.query(insertSql, insertParams);
      const patientId = result.insertId;

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, "CREATE_PATIENT", "patients", ?)',
        [tenantId, actorId, patientId]
      );

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully.',
        data: {
          id: patientId,
          mrn,
          first_name,
          middle_name,
          last_name,
          dob_ethiopian
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Fetch a single patient by ID
  getById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.id;

      const sql = 'SELECT * FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1';
      const patients = await db.query(sql, [patientId, tenantId]);

      if (!patients || patients.length === 0) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: patients[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Edit patient details
  update: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.id;
      const actorId = req.user.id;
      const {
        first_name,
        middle_name,
        last_name,
        gender,
        dob_gregorian,
        phone_number,
        sub_city,
        woreda,
        kebele,
        house_number,
        fayda_id,
        address,
        emergency_contact_name,
        emergency_contact_phone
      } = req.body;

      if (!first_name || !last_name || !gender || !dob_gregorian) {
        throw new APIError('First name, last name, gender, and Date of Birth (Gregorian) are required.', 400, 'BAD_REQUEST');
      }

      // Check existence
      const [patient] = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patientId, tenantId]);
      if (!patient) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      // Re-translate Gregorian date of birth to Ethiopian
      const dob_ethiopian = geezCalendar.toEthiopian(dob_gregorian);

      const updateSql = `
        UPDATE patients 
        SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, 
            dob_gregorian = ?, dob_ethiopian = ?, phone_number = ?, 
            sub_city = ?, woreda = ?, kebele = ?, house_number = ?, fayda_id = ?,
            address = ?, emergency_contact_name = ?, emergency_contact_phone = ?
        WHERE id = ? AND clinic_id = ?
      `;

      await db.query(updateSql, [
        first_name.trim(),
        middle_name ? middle_name.trim() : '',
        last_name.trim(),
        gender,
        dob_gregorian,
        dob_ethiopian,
        phone_number ? phone_number.trim() : null,
        sub_city ? sub_city.trim() : null,
        woreda ? woreda.trim() : null,
        kebele ? kebele.trim() : null,
        house_number ? house_number.trim() : null,
        fayda_id ? fayda_id.trim() : null,
        address ? address.trim() : null,
        emergency_contact_name ? emergency_contact_name.trim() : null,
        emergency_contact_phone ? emergency_contact_phone.trim() : null,
        patientId,
        tenantId
      ]);

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, new_values) VALUES (?, ?, "UPDATE_PATIENT", "patients", ?, ?)',
        [tenantId, actorId, patientId, JSON.stringify({ first_name, last_name, dob_ethiopian, phone_number, sub_city, woreda, fayda_id })]
      );

      res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Delete patient details
  delete: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const patientId = req.params.id;
      const actorId = req.user.id;

      // Check existence
      const [patient] = await db.query('SELECT id FROM patients WHERE id = ? AND clinic_id = ? LIMIT 1', [patientId, tenantId]);
      if (!patient) {
        throw new APIError('Patient record not found.', 404, 'PATIENT_NOT_FOUND');
      }

      // Execute deletion
      try {
        await db.query('DELETE FROM patients WHERE id = ? AND clinic_id = ?', [patientId, tenantId]);
        
        // Audit
        await db.query(
          'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, "DELETE_PATIENT", "patients", ?)',
          [tenantId, actorId, patientId]
        );

        res.status(200).json({
          success: true,
          message: 'Patient record deleted successfully.'
        });
      } catch (dbErr) {
        if (dbErr.code === 'ER_ROW_IS_REFERENCED_2') {
          throw new APIError(
            'Cannot delete patient record with existing clinical consultations, laboratory requests, or invoicing ledger histories.',
            400,
            'FOREIGN_KEY_CONFLICT'
          );
        }
        throw dbErr;
      }
    } catch (error) {
      next(error);
    }
  }
};

module.exports = patientController;
