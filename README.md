# Ethiopia Clinic Management System (CMS)

A multi-tenant clinic management platform built for Ethiopian private clinics. This system is designed around real clinical workflows and includes modules for registration, billing, consultations, laboratory, pharmacy, appointment management, queue control, and AI-assisted insights.

This repository has been fully audited and optimized for production deployment, implementing rigorous security hardening, performance improvements, SEO optimization, and database scalability.

---

## Project Overview

The repository contains two primary applications:

- `backend/` — Node.js + Express REST API with multi-tenant support, JWT authentication, RBAC permissions, workflow-oriented visit and queue management.
- `frontend/` — React + Vite SPA for clinic users, with role-based navigation and workspace dashboards.

---

## ⚡ Production Optimizations & Security Hardening

The codebase incorporates state-of-the-art updates for production deployment:

### 1. Frontend Performance & Core Web Vitals
- **Code Splitting**: Route-based chunk loading implemented using `React.lazy()` and `React.Suspense` inside `AppRoutes.jsx`, optimizing initial page load times and reducing core bundle sizes.
- **Asset Optimization**: Unused raw images and downloads removed, and a lightweight [favicon.svg](frontend/public/favicon.svg) implemented.
- **SEO & Social Graph**: Configured Open Graph, Twitter cards, and structured JSON-LD data in `index.html`. Added `robots.txt` and `sitemap.xml`.
- **Dynamic Meta Tags**: Added a custom `useDocumentMetadata` hook to dynamically adjust browser titles and descriptions on navigation.

### 2. Backend Security Hardening
- **HTTP Header Hardening**: Secured Express via Helmet with a Content Security Policy (CSP) tailored for Google APIs, fonts, and production domain routing.
- **Dynamic CORS**: Configured dynamic Origin verification mapping matching `FRONTEND_URL` environment variables.
- **XSS Sanitization Middleware**: Created `sanitize.js` to strip HTML injection and scripting tags from all request parameters, body properties, and query arguments.
- **Startup Environment Validation**: Integrated `env.js` which verifies database configurations, keys, and security parameters before launching the application.
- **Production Error Masking**: Obfuscated MySQL internal logs and error stack traces from client payloads.

### 3. Backend Performance & Caching
- **API Payload Compression**: Mounted GZIP compression middleware to minimize response size.
- **N+1 Query Resolution**: Refactored `billing.controller.js` to batch-resolve medicine unit prices using a single SQL query (`WHERE id IN (...)`) instead of looping database connections.
- **Bulk Insert Optimization**: Upgraded invoice item insertion from sequential loops to a single bulk SQL write operation.
- **In-Memory Caching**: Added a fast in-memory cache to save static configurations (roles, permissions, and clinic configurations), drastically minimizing DB load.
- **Serverless Log Architecture**: Programmed `logger.js` to automatically bypass file-system streams on serverless platforms (e.g. Vercel) and fall back to standard output streams.

### 4. Database Index Migration
Optimal indexing migration schema defined in `db_indexes.sql` and run on production:
- Composite index on `audit_logs(clinic_id, user_id)`
- Composite index on `lab_results(clinic_id, lab_request_id)`
- Index on `payments(invoice_id)`
- Index on `invoice_items(invoice_id)`
- Composite index on `visits(doctor_id, visit_status)`

### 5. Healthcare (HIPAA) Compliance
- **AI Prompt Redaction**: Redacts patient PHI (Fayda ID, full name, MRN, phone number) before transmitting data to external LLM services.
- **Log Hygiene**: Audited all system levels to ensure no sensitive health histories or clinic notes are logged in raw text formats.

---

## Core Modules

- `Registration` — Patient demographic capture and MRN creation
- `Cashier` — Invoice creation, payment collection, receipts, and finance reports
- `Doctor` — Clinical consultation, diagnosis, notes, lab requests, prescriptions
- `Laboratory` — Paid lab request queue, sample collection, result entry, approval
- `Pharmacy` — Paid prescription queue, inventory, dispensing
- `Billing` — Invoices, payments, unpaid balances
- `Appointment` — Booking and visit preparation
- `AI Features` — Clinical summaries, lab interpretation, stock forecasting, business insights

---

## Folder Structure

- `backend/`
  - `server.js` — Express entrypoint and configuration mounts
  - `src/routes/` — API route definitions
  - `src/controllers/` — Request handlers and transactional controllers
  - `src/services/` — Business logic and AI services
  - `src/middlewares/` — Authentication, sanitization, validation, tenant resolution, error handling
  - `src/config/` — DB setup, logger, env validation, SQL indexes
  - `src/utils/` — Caching and helpers
- `frontend/`
  - `src/App.jsx` / `src/routes/AppRoutes.jsx` — Client routing and chunk suspenses
  - `src/components/` — Layout, navigation, shared UI
  - `src/features/` — Module pages and workspaces
  - `src/constants/` — Roles, navigation definitions
  - `src/services/` — API client and service wrappers

---

## Setup Instructions

### Prerequisites

- Node.js 18+ / npm
- MySQL 8.x (unless using Docker Compose)
- Docker & Docker Compose (recommended for quick local deployment)

### Local Development

#### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file at `backend/.env` with the following values:

```env
PORT=4000
NODE_ENV=production
SKIP_DB=false
DB_HOST=mysql-1baa60-seidsualeh123.a.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=YourDbPasswordHere
DB_NAME=defaultdb
DB_PORT=10629
SSL_MODE=REQUIRED
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=YourJwtSecretHere
GEMINI_API_KEY=YourGeminiApiKeyHere
```

Start the backend:

```bash
npm run dev
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Deployment Configuration

- **Frontend (Netlify)**: Configured in `frontend/netlify.toml` with SPA redirection policies and browser security headers.
- **Backend (Vercel)**: Configured in `backend/vercel.json` for serverless route handling.

---

## License

MIT License
