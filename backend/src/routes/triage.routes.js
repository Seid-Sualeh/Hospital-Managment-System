const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triage.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');

// Secure all endpoints with authentication
router.use(authenticateUser);

// Triage recording (Nurse permission)
router.post('/', requirePermission('WRITE_VITALS'), triageController.create);

// Fetch vitals history (Read EMR record permission)
router.get('/patient/:patientId', requirePermission('READ_RECORD'), triageController.getHistory);

module.exports = router;
