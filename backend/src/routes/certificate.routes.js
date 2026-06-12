const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');

// 1. Public route (no JWT check) - verified by external employers/organizations
router.get('/verify/:token', certificateController.verify);

// 2. Protected routes - certificate issuance (Doctor or Medical staff)
router.post('/', authenticateUser, requirePermission('CREATE_RECORD'), certificateController.create);

module.exports = router;
