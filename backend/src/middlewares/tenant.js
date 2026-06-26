const tenantService = require('../services/tenant.service');
const { APIError } = require('./error');

async function tenantResolver(req, res, next) {
  try {
    const SKIP_DB = String(process.env.SKIP_DB || '').toLowerCase() === 'true';

    const bypassPaths = [
      '/api/v1/health',
      '/api/v1/clinics/onboard',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/tenants',
    ];

    // Bypass non-API paths (root, favicon, etc.) — prevents Vercel health pings from triggering tenant errors
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    if (bypassPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    if (SKIP_DB) {
      req.tenantId = 1;
      req.tenantUuid = 'mock-clinic-uuid-dev-mode';
      req.tenantName = 'Demo Clinic (Dev Mode)';
      req.tenantSubdomain = 'demo';
      return next();
    }

    const tenantHeader = req.headers['x-tenant-id'] || req.headers['x-tenant-subdomain'];

    if (!tenantHeader) {
      throw new APIError(
        'Tenant context required. Provide X-Tenant-ID or X-Tenant-Subdomain header.',
        400,
        'TENANT_HEADER_MISSING'
      );
    }

    const subdomain = String(tenantHeader).toLowerCase().trim();

    const clinic = await tenantService.getTenantBySubdomain(subdomain);

    req.tenantId = clinic.id;
    req.tenantUuid = clinic.uuid;
    req.tenantName = clinic.name;
    req.tenantSubdomain = clinic.subdomain;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = tenantResolver;