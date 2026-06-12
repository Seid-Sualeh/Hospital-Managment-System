const { APIError } = require('./error');

const appointmentValidation = {
  validateCreate: (req, res, next) => {
    const { patient_id, doctor_id, appointment_datetime } = req.body;
    const errors = [];

    if (!patient_id || isNaN(parseInt(patient_id, 10))) {
      errors.push({ field: 'patient_id', message: 'Provide a valid patient ID.' });
    }
    if (!doctor_id || isNaN(parseInt(doctor_id, 10))) {
      errors.push({ field: 'doctor_id', message: 'Provide a valid doctor ID.' });
    }
    
    if (!appointment_datetime) {
      errors.push({ field: 'appointment_datetime', message: 'Appointment date/time is required.' });
    } else {
      const apptDate = new Date(appointment_datetime);
      if (isNaN(apptDate.getTime())) {
        errors.push({ field: 'appointment_datetime', message: 'Provide a valid Date/Time string.' });
      } else if (apptDate < new Date()) {
        errors.push({ field: 'appointment_datetime', message: 'Appointment date/time must be in the future.' });
      }
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  },

  validateReschedule: (req, res, next) => {
    const { appointment_datetime } = req.body;
    const errors = [];

    if (!appointment_datetime) {
      errors.push({ field: 'appointment_datetime', message: 'Appointment date/time is required.' });
    } else {
      const apptDate = new Date(appointment_datetime);
      if (isNaN(apptDate.getTime())) {
        errors.push({ field: 'appointment_datetime', message: 'Provide a valid Date/Time string.' });
      } else if (apptDate < new Date()) {
        errors.push({ field: 'appointment_datetime', message: 'Appointment date/time must be in the future.' });
      }
    }

    if (errors.length > 0) {
      return next(new APIError('Validation failed.', 400, 'VALIDATION_ERROR', errors));
    }
    next();
  }
};

module.exports = appointmentValidation;
