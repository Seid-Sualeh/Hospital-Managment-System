const { APIError } = require('./error');

// Simple regex templates
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ETHIOPIAN_PHONE_REGEX = /^\+2519\d{8}$/; // Enforces +2519XXXXXXXX (12 digits total)

const authValidation = {
  // Validate Login Request
  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !EMAIL_REGEX.test(email)) {
      errors.push({ field: 'email', message: 'Provide a valid email address.' });
    }
    if (!password || password.trim() === '') {
      errors.push({ field: 'password', message: 'Password is required.' });
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  },

  // Validate User Registration Request
  validateRegister: (req, res, next) => {
    const { first_name, last_name, email, phone_number, password, role_id } = req.body;
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
    
    // Password complexity check
    if (!password || password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUppercase || !hasNumber || !hasSpecial) {
        errors.push({ 
          field: 'password', 
          message: 'Password must contain at least one uppercase letter, one digit, and one special character.' 
        });
      }
    }

    if (!role_id || isNaN(parseInt(role_id, 10))) {
      errors.push({ field: 'role_id', message: 'Provide a valid role ID.' });
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  },

  // Validate Forgot Password Request
  validateForgotPassword: (req, res, next) => {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      return next(new APIError('Provide a valid email address.', 400, 'VALIDATION_ERROR', [
        { field: 'email', message: 'Invalid email address.' }
      ]));
    }
    next();
  },

  // Validate Reset Password Request
  validateResetPassword: (req, res, next) => {
    const { token, password } = req.body;
    const errors = [];

    if (!token || token.trim() === '') {
      errors.push({ field: 'token', message: 'Verification reset token is required.' });
    }
    
    // Password complexity check
    if (!password || password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUppercase || !hasNumber || !hasSpecial) {
        errors.push({ 
          field: 'password', 
          message: 'Password must contain at least one uppercase letter, one digit, and one special character.' 
        });
      }
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  }
};

module.exports = authValidation;
