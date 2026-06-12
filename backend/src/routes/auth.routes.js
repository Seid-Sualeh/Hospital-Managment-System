const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');
const authValidation = require('../middlewares/auth.validation');

// 1. Public Auth Routes
router.post('/login', authValidation.validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authValidation.validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidation.validateResetPassword, authController.resetPassword);

// 2. Protected Auth Routes
router.get('/me', authenticateUser, authController.getMe);
router.post('/register', authenticateUser, requirePermission('MANAGE_USERS'), authValidation.validateRegister, authController.register);

module.exports = router;
