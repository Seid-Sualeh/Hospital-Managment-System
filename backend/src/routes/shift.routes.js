const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth');

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

/**
 * @route   POST /api/v1/shifts
 * @desc    Create a new shift
 * @access  Private (Admin only)
 */
router.post('/', requireRole(1), shiftController.createShift);

/**
 * @route   GET /api/v1/shifts
 * @desc    List all shifts
 * @access  Private (Admin only)
 */
router.get('/', requireRole(1), shiftController.listShifts);

/**
 * @route   PUT /api/v1/shifts/:id
 * @desc    Update shift details
 * @access  Private (Admin only)
 */
router.put('/:id', requireRole(1), shiftController.updateShift);

/**
 * @route   DELETE /api/v1/shifts/:id
 * @desc    Delete a shift
 * @access  Private (Admin only)
 */
router.delete('/:id', requireRole(1), shiftController.deleteShift);

/**
 * @route   POST /api/v1/shifts/assign
 * @desc    Assign shift to an employee
 * @access  Private (Admin only)
 */
router.post('/assign', requireRole(1), shiftController.assignShift);

module.exports = router;
