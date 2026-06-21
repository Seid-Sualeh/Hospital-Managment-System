const { APIError } = require('./error');

const ETHIOPIAN_PHONE_REGEX = /^\+2519\d{8}$/;

const patientValidation = {
  validateCreateOrUpdate: (req, res, next) => {
    const { first_name, last_name, gender, dob_gregorian, phone_number, fayda_id } = req.body;
    const errors = [];

    if (!first_name || first_name.trim() === '') {
      errors.push({ field: 'first_name', message: 'First name is required.' });
    }
    if (!last_name || last_name.trim() === '') {
      errors.push({ field: 'last_name', message: 'Last name is required.' });
    }
    if (!gender || (gender !== 'M' && gender !== 'F')) {
      errors.push({ field: 'gender', message: 'Gender must be M or F.' });
    }
    if (!dob_gregorian) {
      errors.push({ field: 'dob_gregorian', message: 'Gregorian Date of Birth is required.' });
    } else {
      const parsedDate = new Date(dob_gregorian);
      if (isNaN(parsedDate.getTime())) {
        errors.push({ field: 'dob_gregorian', message: 'Provide a valid date string (YYYY-MM-DD).' });
      } else if (parsedDate > new Date()) {
        errors.push({ field: 'dob_gregorian', message: 'Date of Birth cannot be in the future.' });
      }
    }

    if (phone_number && !ETHIOPIAN_PHONE_REGEX.test(phone_number)) {
      errors.push({ field: 'phone_number', message: 'Provide a valid Ethiopian phone number (+2519XXXXXXXX).' });
    }

    if (fayda_id && (fayda_id.trim().length !== 12 || isNaN(parseInt(fayda_id, 10)))) {
      errors.push({ field: 'fayda_id', message: 'Fayda ID must be a 12-digit numeric identifier.' });
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  }
};

module.exports = patientValidation;
