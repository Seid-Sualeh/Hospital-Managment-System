const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const leaveController = {
  // Submit a leave request (Employee)
  requestLeave: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;
      const { leave_type_id, start_date, end_date, reason } = req.body;

      if (!leave_type_id || !start_date || !end_date) {
        throw new APIError('Leave type, start date, and end date are required fields.', 400, 'BAD_REQUEST');
      }

      // Verify leave type exists
      const [leaveType] = await db.query('SELECT id FROM leave_types WHERE id = ? AND clinic_id = ? LIMIT 1', [leave_type_id, tenantId]);
      if (!leaveType) {
        throw new APIError('Invalid leave type.', 404, 'NOT_FOUND');
      }

      const insertSql = `
        INSERT INTO leave_requests (clinic_id, user_id, leave_type_id, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;
      const result = await db.query(insertSql, [tenantId, userId, leave_type_id, start_date, end_date, reason ? reason.trim() : null]);

      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully.',
        data: {
          id: result.insertId,
          leave_type_id,
          start_date,
          end_date,
          reason,
          status: 'pending'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user's leave requests
  getMyLeaves: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;

      const sql = `
        SELECT lr.*, lt.name as leave_type_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.user_id = ? AND lr.clinic_id = ?
        ORDER BY lr.created_at DESC
      `;
      const leaves = await db.query(sql, [userId, tenantId]);

      res.status(200).json({
        success: true,
        data: leaves
      });
    } catch (error) {
      next(error);
    }
  },

  // List all leave requests (Admin only)
  listLeaves: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status } = req.query;

      let sql = `
        SELECT lr.*, lt.name as leave_type_name,
               u.first_name, u.last_name, r.name as role_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        JOIN users u ON lr.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        WHERE lr.clinic_id = ?
      `;
      const params = [tenantId];

      if (status) {
        sql += ' AND lr.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY lr.created_at DESC';

      const leaves = await db.query(sql, params);

      res.status(200).json({
        success: true,
        data: leaves
      });
    } catch (error) {
      next(error);
    }
  },

  // Approve or Reject a leave request (Admin only)
  approveRejectLeave: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const adminId = req.user.id;
      const { id } = req.params;
      const { status, comments } = req.body; // status: 'approved' or 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        throw new APIError('Invalid status. Use approved or rejected.', 400, 'BAD_REQUEST');
      }

      // Fetch leave request details
      const [leaveRequest] = await db.query(
        'SELECT * FROM leave_requests WHERE id = ? AND clinic_id = ? LIMIT 1',
        [id, tenantId]
      );
      if (!leaveRequest) {
        throw new APIError('Leave request not found.', 404, 'NOT_FOUND');
      }

      if (leaveRequest.status !== 'pending') {
        throw new APIError('Leave request has already been processed.', 400, 'ALREADY_PROCESSED');
      }

      // Update status
      const updateSql = `
        UPDATE leave_requests 
        SET status = ?, approved_by = ?, comments = ?, updated_at = NOW()
        WHERE id = ? AND clinic_id = ?
      `;
      await db.query(updateSql, [status, adminId, comments ? comments.trim() : null, id, tenantId]);

      // If approved, automatically insert "On Leave" attendance logs for the employee for each day in range
      if (status === 'approved') {
        const start = new Date(leaveRequest.start_date);
        const end = new Date(leaveRequest.end_date);
        
        // Loop through each day from start to end date
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const formattedDate = d.toISOString().split('T')[0];
          
          // Insert "On Leave" record, updating if there's an existing entry
          const attendanceSql = `
            INSERT INTO staff_attendance (clinic_id, user_id, work_date, status, notes)
            VALUES (?, ?, ?, 'On Leave', ?)
            ON DUPLICATE KEY UPDATE status = 'On Leave', notes = ?
          `;
          await db.query(attendanceSql, [
            tenantId,
            leaveRequest.user_id,
            formattedDate,
            `Approved Leave Request #${id}`,
            `Approved Leave Request #${id}`
          ]);
        }
      }

      res.status(200).json({
        success: true,
        message: `Leave request has been ${status}.`
      });
    } catch (error) {
      next(error);
    }
  },

  // Get leave types catalog
  getLeaveTypes: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const sql = 'SELECT * FROM leave_types WHERE clinic_id = ?';
      const types = await db.query(sql, [tenantId]);

      res.status(200).json({
        success: true,
        data: types
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = leaveController;
