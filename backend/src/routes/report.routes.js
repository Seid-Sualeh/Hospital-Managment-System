const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateUser } = require('../middlewares/auth');

// Protected reports endpoints - require user session
router.get('/patients', authenticateUser, reportController.getPatientsReport);
router.get('/revenue', authenticateUser, reportController.getRevenueReport);
router.get('/labs', authenticateUser, reportController.getLabsReport);
router.get('/inventory', authenticateUser, reportController.getInventoryReport);
router.get('/appointments', authenticateUser, reportController.getAppointmentsReport);
router.get('/hmis', authenticateUser, reportController.getHMISTallySheet);

module.exports = router;
