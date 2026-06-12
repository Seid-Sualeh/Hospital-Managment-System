const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const shiftController = {
  // Create a new shift
  createShift: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { name, start_time, end_time, grace_period_minutes = 15 } = req.body;

      if (!name || !start_time || !end_time) {
        throw new APIError('Name, start time, and end time are required fields.', 400, 'BAD_REQUEST');
      }

      const insertSql = `
        INSERT INTO staff_shifts (clinic_id, name, start_time, end_time, grace_period_minutes)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await db.query(insertSql, [tenantId, name.trim(), start_time, end_time, grace_period_minutes]);

      res.status(201).json({
        success: true,
        message: 'Shift created successfully.',
        data: {
          id: result.insertId,
          name,
          start_time,
          end_time,
          grace_period_minutes
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // List all shifts for the clinic
  listShifts: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const sql = 'SELECT * FROM staff_shifts WHERE clinic_id = ? ORDER BY created_at DESC';
      const shifts = await db.query(sql, [tenantId]);

      res.status(200).json({
        success: true,
        data: shifts
      });
    } catch (error) {
      next(error);
    }
  },

  // Update shift details
  updateShift: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { name, start_time, end_time, grace_period_minutes } = req.body;

      const [shift] = await db.query('SELECT id FROM staff_shifts WHERE id = ? AND clinic_id = ? LIMIT 1', [id, tenantId]);
      if (!shift) {
        throw new APIError('Shift not found.', 404, 'NOT_FOUND');
      }

      const updateSql = `
        UPDATE staff_shifts 
        SET name = COALESCE(?, name),
            start_time = COALESCE(?, start_time),
            end_time = COALESCE(?, end_time),
            grace_period_minutes = COALESCE(?, grace_period_minutes)
        WHERE id = ? AND clinic_id = ?
      `;
      await db.query(updateSql, [name ? name.trim() : null, start_time || null, end_time || null, grace_period_minutes || null, id, tenantId]);

      res.status(200).json({
        success: true,
        message: 'Shift updated successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a shift
  deleteShift: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const [shift] = await db.query('SELECT id FROM staff_shifts WHERE id = ? AND clinic_id = ? LIMIT 1', [id, tenantId]);
      if (!shift) {
        throw new APIError('Shift not found.', 404, 'NOT_FOUND');
      }

      await db.query('DELETE FROM staff_shifts WHERE id = ? AND clinic_id = ?', [id, tenantId]);

      res.status(200).json({
        success: true,
        message: 'Shift deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Assign shift to an employee
  assignShift: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { user_id, shift_id } = req.body;

      if (!user_id) {
        throw new APIError('User ID is required.', 400, 'BAD_REQUEST');
      }

      // Verify user exists in this clinic
      const [user] = await db.query('SELECT id FROM users WHERE id = ? AND clinic_id = ? LIMIT 1', [user_id, tenantId]);
      if (!user) {
        throw new APIError('User not found in this clinic.', 404, 'NOT_FOUND');
      }

      // Verify shift exists in this clinic (if not null)
      if (shift_id) {
        const [shift] = await db.query('SELECT id FROM staff_shifts WHERE id = ? AND clinic_id = ? LIMIT 1', [shift_id, tenantId]);
        if (!shift) {
          throw new APIError('Shift not found in this clinic.', 404, 'NOT_FOUND');
        }
      }

      await db.query('UPDATE users SET shift_id = ? WHERE id = ? AND clinic_id = ?', [shift_id || null, user_id, tenantId]);

      res.status(200).json({
        success: true,
        message: shift_id ? 'Shift assigned successfully.' : 'Shift unassigned successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = shiftController;
