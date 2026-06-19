const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const visitService = require('../services/visit.service');

const STATUS_TO_UI = {
  ordered: 'pending',
  samples_collected: 'in_progress',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const STATUS_FROM_UI = {
  pending: 'ordered',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const formatLabRequest = (row) => {
  let testNames = [];
  try {
    testNames = typeof row.test_names === 'string'
      ? JSON.parse(row.test_names)
      : row.test_names || [];
  } catch {
    testNames = [];
  }

  return {
    ...row,
    request_uid: `LAB-${String(row.id).padStart(5, '0')}`,
    patient_uid: row.patient_mrn,
    patient_name: `${row.patient_first_name || ''} ${row.patient_last_name || ''}`.trim(),
    doctor: `Dr. ${row.doctor_first_name || ''} ${row.doctor_last_name || ''}`.trim(),
    test_name: testNames.join(', ') || row.test_name || '—',
    date: row.request_date,
    status: STATUS_TO_UI[row.status] || row.status,
  };
};

const labController = {
  // 1. List lab requests (filtered by status and tenant)
  listRequests: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status, search } = req.query;

      let sql = `
        SELECT lr.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn as patient_mrn,
               u.first_name as doctor_first_name, u.last_name as doctor_last_name
        FROM lab_requests lr
        JOIN patients p ON lr.patient_id = p.id
        JOIN users u ON lr.doctor_id = u.id
        WHERE lr.clinic_id = ?
      `;
      const params = [tenantId];

      if (status) {
        const dbStatus = STATUS_FROM_UI[status] || status;
        sql += ' AND lr.status = ?';
        params.push(dbStatus);
      }

      if (search) {
        const wildcard = `%${search}%`;
        sql += ' AND (p.mrn LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ? OR lr.test_names LIKE ?)';
        params.push(wildcard, wildcard, wildcard, wildcard);
      }

      sql += ' ORDER BY lr.request_date DESC';

      const requests = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: requests.map(formatLabRequest),
      });
    } catch (error) {
      next(error);
    }
  },

  getRequest: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.id;

      const [request] = await db.query(
        `SELECT lr.*, 
                p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn as patient_mrn,
                u.first_name as doctor_first_name, u.last_name as doctor_last_name
         FROM lab_requests lr
         JOIN patients p ON lr.patient_id = p.id
         JOIN users u ON lr.doctor_id = u.id
         WHERE lr.id = ? AND lr.clinic_id = ?
         LIMIT 1`,
        [requestId, tenantId],
      );

      if (!request) {
        throw new APIError('Lab request not found.', 404, 'LAB_REQUEST_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: formatLabRequest(request),
      });
    } catch (error) {
      next(error);
    }
  },

  createRequest: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;
      const { patient_uid, patient_id, test_name, test_names, doctor_id, notes, priority } = req.body;

      const tests = test_names || (test_name ? [test_name] : []);
      if (!tests.length) {
        throw new APIError('At least one test name is required.', 400, 'BAD_REQUEST');
      }

      let patientId = patient_id;
      if (!patientId && patient_uid) {
        const [patient] = await db.query(
          'SELECT id FROM patients WHERE clinic_id = ? AND mrn = ? LIMIT 1',
          [tenantId, patient_uid],
        );
        if (!patient) {
          throw new APIError('Patient not found for the provided UID.', 404, 'PATIENT_NOT_FOUND');
        }
        patientId = patient.id;
      }

      if (!patientId) {
        throw new APIError('Patient ID or UID is required.', 400, 'BAD_REQUEST');
      }

      let doctorId = doctor_id || (req.user.roleId === 2 ? actorId : null);
      if (!doctorId) {
        const [doctor] = await db.query(
          'SELECT id FROM users WHERE clinic_id = ? AND role_id = 2 AND is_active = TRUE LIMIT 1',
          [tenantId],
        );
        if (!doctor) {
          throw new APIError('No active doctor found to assign this lab request.', 400, 'DOCTOR_REQUIRED');
        }
        doctorId = doctor.id;
      }

      const consultSql = `
        INSERT INTO consultations (
          clinic_id, patient_id, doctor_id, consultation_datetime,
          chief_complaints, clinical_notes, status
        ) VALUES (?, ?, ?, NOW(), ?, ?, 'completed')
      `;
      const consultResult = await db.query(consultSql, [
        tenantId,
        patientId,
        doctorId,
        notes || 'Lab order',
        priority === 'urgent' ? 'Urgent lab request' : null,
      ]);
      const consultationId = consultResult.insertId;

      const labSql = `
        INSERT INTO lab_requests (
          clinic_id, consultation_id, patient_id, doctor_id, request_date, test_names, status
        ) VALUES (?, ?, ?, ?, NOW(), ?, 'ordered')
      `;
      const labResult = await db.query(labSql, [
        tenantId,
        consultationId,
        patientId,
        doctorId,
        JSON.stringify(tests),
      ]);

      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "LAB_REQUEST_CREATED", "lab_requests", ?, ?)',
        [tenantId, actorId, labResult.insertId, `Ordered: ${tests.join(', ')}`],
      );

      res.status(201).json({
        success: true,
        message: 'Lab request created successfully.',
        data: { id: labResult.insertId },
      });
    } catch (error) {
      next(error);
    }
  },

  enterResultSimple: async (req, res, next) => {
    try {
      const { result, interpretation, test_name } = req.body;
      if (!result) {
        throw new APIError('Result text is required.', 400, 'BAD_REQUEST');
      }

      req.body = {
        test_name: test_name || 'General',
        results_json: { result, interpretation: interpretation || null },
        technician_notes: interpretation || null,
      };

      return labController.enterResults(req, res, next);
    } catch (error) {
      next(error);
    }
  },

  // 2. Track sample collection status
  collectSample: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.id;
      const actorId = req.user.id;

      const [request] = await db.query('SELECT id FROM lab_requests WHERE id = ? AND clinic_id = ? LIMIT 1', [requestId, tenantId]);
      if (!request) {
        throw new APIError('Lab request not found.', 404, 'LAB_REQUEST_NOT_FOUND');
      }

      // Check payment verification lock (lab tests require paid invoices or corporate sponsorship)
      const invoiceSql = `
        SELECT i.status, i.sponsor_id
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE ii.item_type = 'laboratory' AND ii.item_reference_id = ? AND ii.clinic_id = ?
        LIMIT 1
      `;
      const invoices = await db.query(invoiceSql, [requestId, tenantId]);
      if (!invoices || invoices.length === 0) {
        throw new APIError('Cannot collect sample. Laboratory request has not been billed.', 402, 'BILLING_REQUIRED');
      }
      if (invoices[0].status !== 'paid' && !invoices[0].sponsor_id) {
        throw new APIError('Cannot collect sample. Linked invoice is unpaid.', 402, 'PAYMENT_REQUIRED');
      }

      await db.query('UPDATE lab_requests SET status = "samples_collected" WHERE id = ?', [requestId]);

      // Transition visit status to IN_LABORATORY
      const [visit] = await db.query('SELECT id FROM visits WHERE lab_request_id = ? AND clinic_id = ? LIMIT 1', [requestId, tenantId]);
      if (visit) {
        await visitService.updateStatus(visit.id, tenantId, 'IN_LABORATORY', actorId);
      }

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "LAB_SAMPLE_COLLECTED", "lab_requests", ?, "Samples collected for processing")',
        [tenantId, actorId, requestId]
      );

      res.status(200).json({
        success: true,
        message: 'Sample status updated to Collected.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Enter results for a requested test panel
  enterResults: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.id;
      const technicianId = req.user.id;
      const { test_name, results_json, technician_notes } = req.body;

      if (!test_name || !results_json) {
        throw new APIError('Test name and results payload are required.', 400, 'BAD_REQUEST');
      }

      // Check request validity
      const [request] = await db.query('SELECT id, patient_id FROM lab_requests WHERE id = ? AND clinic_id = ? LIMIT 1', [requestId, tenantId]);
      if (!request) {
        throw new APIError('Lab request not found.', 404, 'LAB_REQUEST_NOT_FOUND');
      }

      // Check payment lock here as well (prevent processing results for unpaid orders)
      const invoiceSql = `
        SELECT i.status, i.sponsor_id
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE ii.item_type = 'laboratory' AND ii.item_reference_id = ? AND ii.clinic_id = ?
        LIMIT 1
      `;
      const invoices = await db.query(invoiceSql, [requestId, tenantId]);
      if (!invoices || invoices.length === 0) {
        throw new APIError('Cannot enter results. Laboratory request has not been billed.', 402, 'BILLING_REQUIRED');
      }
      if (invoices[0].status !== 'paid' && !invoices[0].sponsor_id) {
        throw new APIError('Cannot enter results. Linked invoice is unpaid.', 402, 'PAYMENT_REQUIRED');
      }

      // Check if result already exists (if so, update, otherwise insert)
      const [existingResult] = await db.query(
        'SELECT id FROM lab_results WHERE lab_request_id = ? AND test_name = ? LIMIT 1',
        [requestId, test_name]
      );

      if (existingResult) {
        const updateSql = `
          UPDATE lab_results 
          SET results_json = ?, technician_notes = ?, result_date = NOW(), technician_id = ?
          WHERE id = ?
        `;
        await db.query(updateSql, [JSON.stringify(results_json), technician_notes || null, technicianId, existingResult.id]);
      } else {
        const insertSql = `
          INSERT INTO lab_results (
            clinic_id, lab_request_id, patient_id, technician_id, test_name, results_json, technician_notes, result_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        await db.query(insertSql, [
          tenantId,
          requestId,
          request.patient_id,
          technicianId,
          test_name,
          JSON.stringify(results_json),
          technician_notes || null
        ]);
      }

      // Update lab request status to in_progress
      await db.query('UPDATE lab_requests SET status = "in_progress" WHERE id = ?', [requestId]);

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "LAB_RESULT_ENTERED", "lab_results", ?, ?)',
        [tenantId, technicianId, requestId, `Entered findings for ${test_name}`]
      );

      res.status(200).json({
        success: true,
        message: `Results entered for ${test_name}.`
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Verify and Approve complete lab requests
  approveResults: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.id;
      const actorId = req.user.id; // Lab Supervisor/Pathologist/Admin

      const [request] = await db.query('SELECT id, consultation_id FROM lab_requests WHERE id = ? AND clinic_id = ? LIMIT 1', [requestId, tenantId]);
      if (!request) {
        throw new APIError('Lab request not found.', 404, 'LAB_REQUEST_NOT_FOUND');
      }

      // Set status to completed (approved)
      await db.query('UPDATE lab_requests SET status = "completed" WHERE id = ?', [requestId]);

      // Transition visit status to LAB_COMPLETED (auto-adds back to Doctor Consultation Queue)
      const [visit] = await db.query('SELECT id FROM visits WHERE lab_request_id = ? AND clinic_id = ? LIMIT 1', [requestId, tenantId]);
      if (visit) {
        await visitService.updateStatus(visit.id, tenantId, 'LAB_COMPLETED', actorId);
      }

      // Audit Log
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, "LAB_RESULT_APPROVED", "lab_requests", ?, "Verified and released results report")',
        [tenantId, actorId, requestId]
      );

      res.status(200).json({
        success: true,
        message: 'Lab results verified and approved for clinical release.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Fetch full results report for print voucher templates
  getResultsReport: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const requestId = req.params.id;

      const [request] = await db.query(
        `SELECT lr.*, 
                p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn as patient_mrn, p.gender, p.dob_ethiopian,
                u.first_name as doctor_first_name, u.last_name as doctor_last_name
         FROM lab_requests lr
         JOIN patients p ON lr.patient_id = p.id
         JOIN users u ON lr.doctor_id = u.id
         WHERE lr.id = ? AND lr.clinic_id = ?
         LIMIT 1`,
        [requestId, tenantId]
      );

      if (!request) {
        throw new APIError('Lab request not found.', 404, 'LAB_REQUEST_NOT_FOUND');
      }

      // Fetch all result details
      const results = await db.query('SELECT * FROM lab_results WHERE lab_request_id = ?', [requestId]);

      res.status(200).json({
        success: true,
        data: {
          request,
          results: results.map(r => ({
            ...r,
            results_json: JSON.parse(r.results_json)
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = labController;
