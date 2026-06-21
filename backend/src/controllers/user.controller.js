const db = require('../config/db');
const authService = require('../services/auth.service');
const { APIError } = require('../middlewares/error');

const userController = {
  // 1. List users inside this tenant
  list: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { search } = req.query;

      let sql = `
        SELECT u.id, u.clinic_id, u.first_name, u.last_name, u.email, u.phone_number, u.role_id, u.is_active, u.created_at,
               r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.clinic_id = ?
      `;
      const params = [tenantId];

      if (search) {
        sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)';
        const searchWildcard = `%${search}%`;
        params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
      }

      sql += ' ORDER BY u.created_at DESC';

      const users = await db.query(sql, params);
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Fetch single user by ID
  getById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;

      const sql = `
        SELECT u.id, u.clinic_id, u.first_name, u.last_name, u.email, u.phone_number, u.role_id, u.is_active, u.created_at,
               r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.clinic_id = ?
        LIMIT 1
      `;
      const users = await db.query(sql, [userId, tenantId]);

      if (!users || users.length === 0) {
        throw new APIError('User not found.', 404, 'USER_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Create a new user (reuses registration logic in AuthService)
  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const actorId = req.user.id;

      // Delegate registration to AuthService
      const newUser = await authService.registerClinicUser(tenantId, req.body);

      // Audit Log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'CREATE_USER', 'users', ?)",
        [tenantId, actorId, newUser.id]
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Update user details
  update: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const actorId = req.user.id;
      const { first_name, last_name, email, phone_number, role_id } = req.body;

      if (!first_name || !last_name || !email || !phone_number || !role_id) {
        throw new APIError('First name, last name, email, phone, and role ID are required.', 400, 'BAD_REQUEST');
      }

      // Check user existence
      const [user] = await db.query('SELECT id FROM users WHERE id = ? AND clinic_id = ? LIMIT 1', [userId, tenantId]);
      if (!user) {
        throw new APIError('User not found.', 404, 'USER_NOT_FOUND');
      }

      // Check conflict for email under this clinic
      const [emailConflict] = await db.query(
        'SELECT id FROM users WHERE clinic_id = ? AND email = ? AND id != ? LIMIT 1',
        [tenantId, email.trim(), userId]
      );
      if (emailConflict) {
        throw new APIError('A user with this email is already registered in this clinic.', 409, 'EMAIL_CONFLICT');
      }

      // Check conflict for phone under platform
      const [phoneConflict] = await db.query(
        'SELECT id FROM users WHERE phone_number = ? AND id != ? LIMIT 1',
        [phone_number.trim(), userId]
      );
      if (phoneConflict) {
        throw new APIError('A user with this phone number is already registered in the system.', 409, 'PHONE_CONFLICT');
      }

      const updateSql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, phone_number = ?, role_id = ? 
        WHERE id = ? AND clinic_id = ?
      `;
      await db.query(updateSql, [
        first_name.trim(),
        last_name.trim(),
        email.trim(),
        phone_number.trim(),
        role_id,
        userId,
        tenantId
      ]);

      // Audit Log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, new_values) VALUES (?, ?, 'UPDATE_USER', 'users', ?, ?)",
        [tenantId, actorId, userId, JSON.stringify({ first_name, last_name, email, phone_number, role_id })]
      );

      res.status(200).json({
        success: true,
        message: 'User details updated successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Delete a user
  delete: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const actorId = req.user.id;

      // Prevent self-deletion
      if (parseInt(userId) === parseInt(actorId)) {
        throw new APIError('Self-deletion is not permitted.', 400, 'SELF_DESTRUCT_PREVENTED');
      }

      // Check existence
      const [user] = await db.query('SELECT id FROM users WHERE id = ? AND clinic_id = ? LIMIT 1', [userId, tenantId]);
      if (!user) {
        throw new APIError('User record not found.', 404, 'USER_NOT_FOUND');
      }

      // Try deleting user (MySQL foreign key restrictions will prevent deletion if historical logs exist)
      try {
        await db.query('DELETE FROM users WHERE id = ? AND clinic_id = ?', [userId, tenantId]);
        
        // Audit
        await db.query(
          "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'DELETE_USER', 'users', ?)",
          [tenantId, actorId, userId]
        );

        res.status(200).json({
          success: true,
          message: 'User record deleted successfully.'
        });
      } catch (dbErr) {
        if (dbErr.code === 'ER_ROW_IS_REFERENCED_2') {
          // Fallback to recommending deactivation instead of hard delete to preserve relational history
          throw new APIError(
            'Cannot delete user because they have historical EMR, prescriptions, or billing interactions. Deactivate the user instead.',
            400,
            'FOREIGN_KEY_CONFLICT'
          );
        }
        throw dbErr;
      }
    } catch (error) {
      next(error);
    }
  },

  // 6. Toggle User Activation Status (Deactivate / Reactivate)
  toggleStatus: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const actorId = req.user.id;
      const { is_active } = req.body;

      if (is_active === undefined) {
        throw new APIError('Active state toggle (is_active) parameter is required.', 400, 'BAD_REQUEST');
      }

      if (parseInt(userId) === parseInt(actorId)) {
        throw new APIError('Self-deactivation is not permitted.', 400, 'SELF_DEACTIVATION_PREVENTED');
      }

      const [user] = await db.query('SELECT id FROM users WHERE id = ? AND clinic_id = ? LIMIT 1', [userId, tenantId]);
      if (!user) {
        throw new APIError('User record not found.', 404, 'USER_NOT_FOUND');
      }

      const activeBool = is_active === true || is_active === 'true' || is_active === 1;

      await db.query('UPDATE users SET is_active = ? WHERE id = ? AND clinic_id = ?', [activeBool, userId, tenantId]);

      // Audit Log
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id, remarks) VALUES (?, ?, 'TOGGLE_USER_STATUS', 'users', ?, ?)",
        [tenantId, actorId, userId, activeBool ? 'Reactivated user' : 'Deactivated user']
      );

      res.status(200).json({
        success: true,
        message: `User successfully ${activeBool ? 'reactivated' : 'deactivated'}.`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
