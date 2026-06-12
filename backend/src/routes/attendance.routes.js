const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth');

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

/**
 * @route   POST /api/v1/attendance/check-in
 * @desc    Record daily check-in
 * @access  Private (All Employees)
 */
router.post('/check-in', attendanceController.checkIn);

/**
 * @route   POST /api/v1/attendance/check-out
 * @desc    Record daily check-out
 * @access  Private (All Employees)
 */
router.post('/check-out', attendanceController.checkOut);

/**
 * @route   GET /api/v1/attendance/my-attendance
 * @desc    Fetch active user's attendance logs
 * @access  Private (All Employees)
 */
router.get('/my-attendance', attendanceController.getMyAttendance);

/**
 * @route   GET /api/v1/attendance/stats
 * @desc    Get aggregated dashboard stats & late lists
 * @access  Private (Admin only)
 */
router.get('/stats', requireRole(1), attendanceController.getAttendanceStats);

/**
 * @route   GET /api/v1/attendance/list
 * @desc    List all attendance logs with filters
 * @access  Private (Admin only)
 */
router.get('/list', requireRole(1), attendanceController.listAttendance);

/**
 * @route   PUT /api/v1/attendance/:id/approve
 * @desc    Approve and lock attendance log
 * @access  Private (Admin only)
 */
router.put('/:id/approve', requireRole(1), attendanceController.approveAttendance);

/**
 * @route   GET /api/v1/attendance/reports
 * @desc    Fetch daily/weekly/monthly attendance report data
 * @access  Private (Admin only)
 */
router.get('/reports', requireRole(1), attendanceController.getAttendanceReports);

module.exports = router;
