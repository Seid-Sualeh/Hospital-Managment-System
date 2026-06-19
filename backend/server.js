const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

// Configs and Helpers
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });
const logger = require("./src/config/logger");
const db = require("./src/config/db");

// Middlewares
const tenantResolver = require("./src/middlewares/tenant");
const { errorHandler } = require("./src/middlewares/error");

// Router imports
const authRoutes = require("./src/routes/auth.routes");
const patientRoutes = require("./src/routes/patient.routes");
const consultationRoutes = require("./src/routes/consultation.routes");
const billingRoutes = require("./src/routes/billing.routes");
const userRoutes = require("./src/routes/user.routes");
const appointmentRoutes = require("./src/routes/appointment.routes");
const labRoutes = require("./src/routes/lab.routes");
const pharmacyRoutes = require("./src/routes/pharmacy.routes");
const reportRoutes = require("./src/routes/report.routes");
const aiRoutes = require("./src/routes/ai.routes");
const triageRoutes = require("./src/routes/triage.routes");
const certificateRoutes = require("./src/routes/certificate.routes");
const visitRoutes = require("./src/routes/visit.routes");
const queueRoutes = require("./src/routes/queue.routes");
const shiftRoutes = require("./src/routes/shift.routes");
const leaveRoutes = require("./src/routes/leave.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");
const settingsRoutes = require("./src/routes/settings.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Security and HTTP Headers
app.use(helmet());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiLimiter);

// Dynamic CORS whitelist
// Allow common local dev ports (Vite:5173, CRA/React:3000)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const originRegex = /^https?:\/\/([a-z0-9-]+\.)?cms\.et(:[0-9]+)?$/;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list exactly or matches regex for subdomains
      const isAllowed =
        allowedOrigins.some(
          (ao) => origin === ao || origin.startsWith(ao + "/"),
        ) || originRegex.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging via Morgan routing through Winston
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

// Apply Tenant Isolation Resolver globally for all API endpoints
app.use(tenantResolver);

// API Route Bindings
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/consultations", consultationRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/labs", labRoutes);
app.use("/api/v1/pharmacy", pharmacyRoutes);
app.use("/api/v1/visits", visitRoutes);
app.use("/api/v1/queues", queueRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/triage", triageRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/leaves", leaveRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/settings", settingsRoutes);

// Health Check API
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    tenantContext: req.tenantId
      ? { id: req.tenantId, name: req.tenantName }
      : "global",
  });
});

// Centralized error handling middleware (must be mounted last)
app.use(errorHandler);

// Database connection diagnostics and server startup
const SKIP_DB = String(process.env.SKIP_DB || "").toLowerCase() === "true";

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`[Server] CMS SaaS Engine listening at:${PORT}`);
  });
};

if (SKIP_DB) {
  logger.warn(
    "[Server] SKIP_DB=true — skipping database connection check. Server will start without verifying DB.",
  );
  startServer();
} else {
  db.testConnection()
    .then((connected) => {
      if (connected) {
        startServer();
      } else {
        logger.error(
          "[Server] Critical Error: Unable to verify database connection. Server startup aborted.",
        );
        process.exit(1);
      }
    })
    .catch((err) => {
      logger.error(
        "[Server] Unexpected error while testing database connection:",
        err,
      );
      process.exit(1);
    });
}

module.exports = app;
