const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const DEFAULT_SETTINGS = {
  clinic: {
    name: 'MediCare Clinic',
    email: '',
    phone: '',
    address: '',
    website: '',
    tin_number: '',
    license_number: '',
    tagline: '',
  },
  hours: [
    { day: 'Monday', open: true, start: '08:00', end: '17:00' },
    { day: 'Tuesday', open: true, start: '08:00', end: '17:00' },
    { day: 'Wednesday', open: true, start: '08:00', end: '17:00' },
    { day: 'Thursday', open: true, start: '08:00', end: '17:00' },
    { day: 'Friday', open: true, start: '08:00', end: '17:00' },
    { day: 'Saturday', open: true, start: '08:00', end: '13:00' },
    { day: 'Sunday', open: false, start: '08:00', end: '17:00' },
  ],
  notifications: {
    email_appointments: true,
    sms_appointments: false,
    email_lab_results: true,
    sms_lab_results: false,
    email_billing: true,
    sms_billing: false,
  },
  logo_url: null,
};

const settingsController = {
  getSettings: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      const [clinic] = await db.query(
        'SELECT id, name, license_number FROM clinics WHERE id = ? LIMIT 1',
        [tenantId],
      );

      let stored = {};
      try {
        const rows = await db.query(
          'SELECT settings_json, logo_url FROM clinic_settings WHERE clinic_id = ? LIMIT 1',
          [tenantId],
        );
        if (rows?.[0]) {
          stored = typeof rows[0].settings_json === 'string'
            ? JSON.parse(rows[0].settings_json)
            : rows[0].settings_json || {};
          if (rows[0].logo_url) stored.logo_url = rows[0].logo_url;
        }
      } catch {
        // clinic_settings table may not exist yet; return clinic defaults
      }

      const data = {
        ...DEFAULT_SETTINGS,
        ...stored,
        clinic: {
          ...DEFAULT_SETTINGS.clinic,
          ...(stored.clinic || {}),
          name: clinic?.name || stored.clinic?.name || DEFAULT_SETTINGS.clinic.name,
          license_number: clinic?.license_number || stored.clinic?.license_number || '',
        },
      };

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { clinic, hours, notifications } = req.body;

      if (clinic?.name) {
        await db.query(
          'UPDATE clinics SET name = ?, license_number = COALESCE(?, license_number) WHERE id = ?',
          [clinic.name, clinic.license_number || null, tenantId],
        );
      }

      let existing = {};
      try {
        const rows = await db.query(
          'SELECT settings_json, logo_url FROM clinic_settings WHERE clinic_id = ? LIMIT 1',
          [tenantId],
        );
        if (rows?.[0]) {
          existing = typeof rows[0].settings_json === 'string'
            ? JSON.parse(rows[0].settings_json)
            : rows[0].settings_json || {};
        }
      } catch {
        // Table may not exist
      }

      const merged = {
        ...existing,
        ...(clinic ? { clinic: { ...(existing.clinic || {}), ...clinic } } : {}),
        ...(hours ? { hours } : {}),
        ...(notifications ? { notifications: { ...(existing.notifications || {}), ...notifications } } : {}),
      };

      try {
        await db.query(
          `INSERT INTO clinic_settings (clinic_id, settings_json)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)`,
          [tenantId, JSON.stringify(merged)],
        );
      } catch (err) {
        throw new APIError(
          'Settings storage is not initialized. Run db_settings_migration.sql.',
          500,
          'SETTINGS_STORAGE_UNAVAILABLE',
        );
      }

      res.status(200).json({
        success: true,
        message: 'Settings saved successfully.',
        data: merged,
      });
    } catch (error) {
      next(error);
    }
  },

  uploadLogo: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const logoData = req.body?.logo_data || req.body?.logo_url;

      if (!logoData) {
        throw new APIError('Logo data is required.', 400, 'BAD_REQUEST');
      }

      try {
        await db.query(
          `INSERT INTO clinic_settings (clinic_id, settings_json, logo_url)
           VALUES (?, '{}', ?)
           ON DUPLICATE KEY UPDATE logo_url = VALUES(logo_url)`,
          [tenantId, logoData],
        );
      } catch {
        throw new APIError(
          'Settings storage is not initialized. Run db_settings_migration.sql.',
          500,
          'SETTINGS_STORAGE_UNAVAILABLE',
        );
      }

      res.status(200).json({
        success: true,
        message: 'Logo updated.',
        data: { logo_url: logoData },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = settingsController;
