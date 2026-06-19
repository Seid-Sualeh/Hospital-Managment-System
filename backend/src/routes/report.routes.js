const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');

router.get('/patients', authenticateUser, requirePermission('READ_PATIENT'), reportController.getPatientsReport);
router.get('/revenue', authenticateUser, requirePermission('VIEW_FINANCIALS'), reportController.getRevenueReport);
router.get('/labs', authenticateUser, requirePermission('READ_LAB_REQUEST'), reportController.getLabsReport);
router.get('/inventory', authenticateUser, requirePermission('MANAGE_STOCK'), reportController.getInventoryReport);
router.get('/appointments', authenticateUser, requirePermission('READ_PATIENT'), reportController.getAppointmentsReport);
router.get('/hmis', authenticateUser, requirePermission('VIEW_FINANCIALS'), reportController.getHMISTallySheet);

module.exports = router;
