const { APIError } = require('./error');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ETHIOPIAN_PHONE_REGEX = /^\+2519\d{8}$/;

const userValidation = {
  // Validate User Details Updates
  validateUpdate: (req, res, next) => {
    const { first_name, last_name, email, phone_number, role_id } = req.body;
    const errors = [];

    if (!first_name || first_name.trim() === '') {
      errors.push({ field: 'first_name', message: 'First name is required.' });
    }
    if (!last_name || last_name.trim() === '') {
      errors.push({ field: 'last_name', message: 'Last name is required.' });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.push({ field: 'email', message: 'Provide a valid email address.' });
    }
    if (!phone_number || !ETHIOPIAN_PHONE_REGEX.test(phone_number)) {
      errors.push({ field: 'phone_number', message: 'Provide a valid Ethiopian phone number (+2519XXXXXXXX).' });
    }
    if (!role_id || isNaN(parseInt(role_id, 10))) {
      errors.push({ field: 'role_id', message: 'Provide a valid role ID.' });
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  }
};

module.exports = userValidation;
