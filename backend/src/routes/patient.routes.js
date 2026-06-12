const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');

// Protect all routes with JWT auth middleware
router.use(authenticateUser);

router.get('/', requirePermission('READ_PATIENT'), patientController.list);
router.post('/', requirePermission('CREATE_PATIENT'), patientController.create);
router.get('/:id', requirePermission('READ_PATIENT'), patientController.getById);
router.put('/:id', requirePermission('CREATE_PATIENT'), patientController.update);
router.delete('/:id', requirePermission('MANAGE_USERS'), patientController.delete);

module.exports = router;
