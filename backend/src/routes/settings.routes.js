const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth');

router.use(authenticateUser, requireRole(1));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.post('/logo', settingsController.uploadLogo);

module.exports = router;
