const db = require("../config/db");
const { APIError } = require("./error");

// Simple subdomain-to-clinic in-memory cache to prevent database load
const tenantCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

/**
 * Tenant resolution middleware
 * Parses subdomain from Host or maps X-Tenant-ID header to isolate tenant databases.
 */
async function tenantResolver(req, res, next) {
  try {
    // Check for SKIP_DB mode first (dev/testing) - inject mock tenant for all routes except health/onboard
    const SKIP_DB = String(process.env.SKIP_DB || "").toLowerCase() === "true";

    // Default system bypass routes (like global onboarding landing page or health check)
    const bypassPaths = ["/api/v1/health", "/api/v1/clinics/onboard"];
    if (bypassPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (SKIP_DB) {
      // Inject mock tenant context for all non-bypass routes in dev mode
      req.tenantId = 1; // Mock clinic ID
      req.tenantUuid = "mock-clinic-uuid-dev-mode";
      req.tenantName = "Demo Clinic (Dev Mode)";
      return next();
    }

    let subdomain = "";

    // 1. Check for custom X-Tenant-ID or X-Tenant-Subdomain header (useful for mobile apps/API testing)
    const headerTenant =
      req.headers["x-tenant-id"] || req.headers["x-tenant-subdomain"];

    if (headerTenant) {
      subdomain = headerTenant.toLowerCase().trim();
    } else {
      // 2. Fallback to parsing Host subdomain (e.g. yared.localhost:5000 or yared.cms.et)
      const host = req.headers.host || "";
      const parts = host.split(".");

      // If there's a subdomain (e.g. 'yared.localhost:5000' -> parts: ['yared', 'localhost:5000'])
      if (parts.length >= 2) {
        subdomain = parts[0].toLowerCase().trim();
      }
    }

    if (!subdomain || subdomain === "www") {
      return next();
    }

    // 3. Check cache or query the database to find the clinic by subdomain
    let clinic = null;
    const now = Date.now();

    if (tenantCache.has(subdomain)) {
      const cached = tenantCache.get(subdomain);
      if (now - cached.cachedAt < CACHE_TTL_MS) {
        clinic = cached.clinic;
      } else {
        tenantCache.delete(subdomain); // Evict expired
      }
    }

    if (!clinic) {
      const sql =
        "SELECT id, uuid, name, status FROM clinics WHERE subdomain = ? LIMIT 1";
      const clinics = await db.query(sql, [subdomain]);

      if (!clinics || clinics.length === 0) {
        throw new APIError(
          `Clinic subdomain '${subdomain}' not found. Verify your subdomain.`,
          404,
          "TENANT_NOT_FOUND",
        );
      }

      clinic = clinics[0];

      // Cache the result
      tenantCache.set(subdomain, { clinic, cachedAt: now });
    }

    // 4. Verify tenant status
    if (clinic.status !== "active" && clinic.status !== "trial") {
      throw new APIError(
        `Clinic account is ${clinic.status}. Please contact support.`,
        403,
        "TENANT_SUSPENDED",
      );
    }

    // 5. Inject tenant values into request object
    req.tenantId = clinic.id;
    req.tenantUuid = clinic.uuid;
    req.tenantName = clinic.name;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = tenantResolver;
