const express = require('express');
const router = express.Router();
const tenantService = require('../services/tenant.service');
const logger = require('../config/logger');

router.get('/lookup', async (req, res, next) => {
  try {
    const identifier = req.query.identifier || req.headers['x-tenant-id'];
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IDENTIFIER',
          message: 'Tenant identifier query param required.'
        }
      });
    }

    const tenant = await tenantService.getTenantBySubdomain(identifier);
    
    res.status(200).json({
      success: true,
      subdomain: tenant.subdomain,
      name: tenant.name,
      status: tenant.status
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Clinic not found. Verify your subdomain.'
        }
      });
    }
    next(error);
  }
});

router.post('/resolve', async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email is required to resolve tenant.'
          }
        });
      }

      const sql = `
        SELECT c.subdomain, c.name, c.status
        FROM clinics c
        JOIN users u ON u.clinic_id = c.id
        WHERE u.email = ? AND u.is_active = TRUE
        LIMIT 1
      `;
      const results = await require('../config/db').query(sql, [email.trim()]);
      
      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'No clinic found for this email.'
          }
        });
      }

      res.status(200).json({
        success: true,
        subdomain: results[0].subdomain,
        name: results[0].name,
        status: results[0].status
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/resolve', async (req, res, next) => {
    try {
      const email = req.query.email;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email query parameter required.'
          }
        });
      }

      const sql = `
        SELECT c.subdomain, c.name, c.status
        FROM clinics c
        JOIN users u ON u.clinic_id = c.id
        WHERE u.email = ? AND u.is_active = TRUE
        LIMIT 1
      `;
      const results = await require('../config/db').query(sql, [email.trim()]);
      
      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'No clinic found for this email.'
          }
        });
      }

      res.status(200).json({
        success: true,
        subdomain: results[0].subdomain,
        name: results[0].name,
        status: results[0].status
      });
    } catch (error) {
      next(error);
    }
  });

module.exports = router;