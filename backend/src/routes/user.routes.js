const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateUser, requirePermission } = require('../middlewares/auth');
const userValidation = require('../middlewares/user.validation');
const authValidation = require('../middlewares/auth.validation');

// All User management routes are strictly guarded by JWT authentication and MANAGE_USERS permission filters
router.use(authenticateUser);
router.use(requirePermission('MANAGE_USERS'));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', authValidation.validateRegister, userController.create);
router.put('/:id', userValidation.validateUpdate, userController.update);
router.delete('/:id', userController.delete);
router.patch('/:id/status', userController.toggleStatus);

module.exports = router;
