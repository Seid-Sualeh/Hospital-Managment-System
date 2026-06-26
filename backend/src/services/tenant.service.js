const db = require('../config/db');
const logger = require('../config/logger');

const CACHE_TTL_MS = 10 * 60 * 1000;

class TenantService {
  constructor() {
    this.tenantCache = new Map();
    this.bypassPaths = new Set([
      '/api/v1/health',
      '/api/v1/clinics/onboard',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/tenants',
    ]);
  }

  isBypassPath(path) {
    return Array.from(this.bypassPaths).some(bp => path.startsWith(bp));
  }

  async resolveTenant(req) {
    const tenantHeader = req.headers['x-tenant-id'] || req.headers['x-tenant-subdomain'];
    const SKIP_DB = String(process.env.SKIP_DB || '').toLowerCase() === 'true';

    if (this.isBypassPath(req.path)) {
      logger.info(`[TenantService] Bypass path: ${req.path}`);
      return null;
    }

    if (SKIP_DB) {
      logger.warn('[TenantService] SKIP_DB=true, using mock tenant');
      return {
        id: 1,
        uuid: 'mock-clinic-uuid-dev-mode',
        name: 'Demo Clinic (Dev Mode)',
        subdomain: 'demo',
        status: 'active'
      };
    }

    if (!tenantHeader) {
      const error = new Error('Tenant header missing. Provide X-Tenant-ID header.');
      error.code = 'TENANT_HEADER_MISSING';
      error.statusCode = 400;
      throw error;
    }

    const identifier = String(tenantHeader).toLowerCase().trim();
    return await this.getTenantBySubdomain(identifier);
  }

  async getTenantBySubdomain(subdomain) {
    const cacheKey = `subdomain:${subdomain}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      logger.debug(`[TenantService] Cache HIT for subdomain: ${subdomain}`);
      return cached;
    }

    const sql = `
      SELECT id, uuid, name, subdomain, status
      FROM clinics
      WHERE subdomain = ?
      LIMIT 1
    `;
    const clinics = await db.query(sql, [subdomain]);

    if (!clinics || clinics.length === 0) {
      const error = new Error(`Clinic subdomain '${subdomain}' not found. Verify your subdomain.`);
      error.code = 'TENANT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const clinic = clinics[0];

    if (clinic.status !== 'active' && clinic.status !== 'trial') {
      const error = new Error(`Clinic account is ${clinic.status}.`);
      error.code = 'TENANT_SUSPENDED';
      error.statusCode = 403;
      throw error;
    }

    this.setCached(cacheKey, clinic);
    logger.debug(`[TenantService] DB LOOKUP for subdomain: ${subdomain}, clinic: ${clinic.name}`);
    return clinic;
  }

  async getTenantById(id) {
    const cacheKey = `id:${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      logger.debug(`[TenantService] Cache HIT for tenant ID: ${id}`);
      return cached;
    }

    const sql = `
      SELECT id, uuid, name, subdomain, status
      FROM clinics
      WHERE id = ?
      LIMIT 1
    `;
    const clinics = await db.query(sql, [id]);

    if (!clinics || clinics.length === 0) {
      const error = new Error('Clinic not found.');
      error.code = 'TENANT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const clinic = clinics[0];
    this.setCached(cacheKey, clinic);
    logger.debug(`[TenantService] DB LOOKUP for tenant ID: ${id}, clinic: ${clinic.name}`);
    return clinic;
  }

  getCached(key) {
    const entry = this.tenantCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      this.tenantCache.delete(key);
      return null;
    }

    return entry.value;
  }

  setCached(key, value) {
    this.tenantCache.set(key, { value, cachedAt: Date.now() });
  }

  clearTenantCache(identifier = null) {
    if (identifier) {
      const subKey = `subdomain:${identifier}`;
      const idKey = `id:${identifier}`;
      this.tenantCache.delete(subKey);
      this.tenantCache.delete(idKey);
    } else {
      this.tenantCache.clear();
    }
    logger.info(`[TenantService] Cache cleared${identifier ? ` for: ${identifier}` : ''}`);
  }
}

module.exports = new TenantService();