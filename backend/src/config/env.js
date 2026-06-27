const logger = require("./logger");

const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

function validateEnv() {
  const missing = [];
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  const SKIP_DB = String(process.env.SKIP_DB || "").toLowerCase() === "true";

  if (SKIP_DB) {
    if (!process.env.JWT_SECRET) {
      logger.error("[ENV VALIDATION] Missing JWT_SECRET even in SKIP_DB mode!");
      process.exit(1);
    }
    logger.warn("[ENV VALIDATION] SKIP_DB=true is enabled. Skipping DB env validation.");
    return;
  }

  if (missing.length > 0) {
    logger.error(
      `[ENV VALIDATION FAIL] The following required environment variables are missing: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  logger.info("[ENV VALIDATION] All required environment variables are present.");
}

module.exports = {
  validateEnv,
};
