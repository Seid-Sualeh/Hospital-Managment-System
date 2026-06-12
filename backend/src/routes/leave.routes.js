const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth');

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

/**
 * @route   POST /api/v1/leaves/request
 * @desc    Submit a leave request
 * @access  Private (All Employees)
 */
router.post('/request', leaveController.requestLeave);

/**
 * @route   GET /api/v1/leaves/my-leaves
 * @desc    Get current user's leave requests
 * @access  Private (All Employees)
 */
router.get('/my-leaves', leaveController.getMyLeaves);

/**
 * @route   GET /api/v1/leaves/types
 * @desc    List all available leave types
 * @access  Private (All Employees)
 */
router.get('/types', leaveController.getLeaveTypes);

/**
 * @route   GET /api/v1/leaves/list
 * @desc    List all leave requests
 * @access  Private (Admin only)
 */
router.get('/list', requireRole(1), leaveController.listLeaves);

/**
 * @route   PUT /api/v1/leaves/:id/approve
 * @desc    Approve or reject a leave request
 * @access  Private (Admin only)
 */
router.put('/:id/approve', requireRole(1), leaveController.approveRejectLeave);

module.exports = router;
