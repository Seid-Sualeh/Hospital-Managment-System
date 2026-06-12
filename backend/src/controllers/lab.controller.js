const db = require('../config/db');
const { APIError } = require('../middlewares/error');
const visitService = require('../services/visit.service');

const labController = {
  // 1. List lab requests (filtered by status and tenant)
  listRequests: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status } = req.query;

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
        sql += ' AND lr.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY lr.request_date DESC';

      const requests = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: requests
      });
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
