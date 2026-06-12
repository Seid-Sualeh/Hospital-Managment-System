# Ethiopia Clinic Management System (CMS)

A multi-tenant clinic management platform built for Ethiopian private clinics. This system is designed around real clinical workflows and includes modules for registration, billing, consultations, laboratory, pharmacy, appointment management, queue control, and AI-assisted insights.

## Project Overview

The repository contains two primary applications:

- `backend/` — Node.js + Express REST API with multi-tenant support, JWT authentication, RBAC permissions, workflow-oriented visit and queue management.
- `frontend/` — React + Vite SPA for clinic users, with role-based navigation and workspace dashboards.

The architecture is built to support real operational flow rather than disconnected CRUD pages.

## Key Workflow

The system follows a real patient flow:

1. Patient arrives and reception registers the patient and opens a visit.
2. Cashier receives consultation payment and only then allows the patient to proceed to the doctor.
3. Doctor consultation captures history, diagnosis, lab orders, prescriptions, and follow-up plans.
4. If labs are ordered, the patient returns to cashier for lab payment.
5. Paid lab requests enter the laboratory queue for sample collection, processing, verification, and approval.
6. Doctor reviews lab results and updates treatment.
7. Pharmacy processes paid prescriptions, checks stock, prepares medication, and dispenses after payment.
8. Visit is closed after the full care workflow is completed.

## Core Modules

- `Registration` — patient demographic capture and MRN creation
- `Cashier` — invoice creation, payment collection, receipts, and finance reports
- `Doctor` — clinical consultation, diagnosis, notes, lab requests, prescriptions
- `Laboratory` — paid lab request queue, sample collection, result entry, approval
- `Pharmacy` — paid prescription queue, inventory, dispensing
- `Billing` — invoices, payments, unpaid balances
- `Appointment` — booking and visit preparation
- `AI Features` — clinical summaries, lab interpretation, stock forecasting, business insights

## Technology Stack

- Backend: Node.js, Express, MySQL, JWT, dotenv, helmet, cors, morgan, winston
- Frontend: React, Vite, React Router, Axios, Bootstrap, Lucide icons
- Containerization: Docker Compose

## Folder Structure

- `backend/`
  - `server.js` — Express entrypoint
  - `src/routes/` — API route definitions
  - `src/controllers/` — request handlers
  - `src/services/` — business logic
  - `src/middlewares/` — authentication, tenant resolution, error handling
  - `src/config/` — DB setup, logger, SQL initialization
- `frontend/`
  - `src/App.jsx` / `src/routes/AppRoutes.jsx` — client routing
  - `src/components/` — layout, navigation, shared UI
  - `src/features/` — module pages and workspaces
  - `src/constants/` — roles, navigation definitions
  - `src/services/` — API client and service wrappers

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
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cms_admin
DB_PASSWORD=AdminSecurePass2026!
DB_NAME=ethiopia_cms
JWT_SECRET=YourJwtSecretHere
GEMINI_API_KEY=YourGeminiApiKeyHere
SKIP_DB=false
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

The frontend should be available at `http://localhost:5173` by default.

### Docker Compose

You can run the full stack with Docker Compose:

```bash
docker compose up --build
```

This will start:

- `mysql_db` on port `3306`
- `backend` on port `5000`
- `frontend` on ports `80` and `443`

### Database Initialization

The Docker Compose setup mounts `backend/src/config/db_init.sql` and `backend/src/config/db_seed.sql`, so MySQL initializes automatically on first startup.

If you run MySQL manually, load these scripts in order:

```bash
mysql -u root -p < backend/src/config/db_init.sql
mysql -u root -p < backend/src/config/db_seed.sql
```

## API Endpoints

The backend exposes a versioned API under `/api/v1/`.

Example endpoints:

- `POST /api/v1/auth/login`
- `GET /api/v1/patients`
- `POST /api/v1/visits`
- `PUT /api/v1/visits/:id/payment`
- `PUT /api/v1/visits/:id/lab`
- `PUT /api/v1/visits/:id/prescription`
- `GET /api/v1/queues/CONSULTATION`
- `GET /api/v1/reports`
- `POST /api/v1/ai/clinical-summary`

## Role-Based Access

The system supports role-based navigation and permissions for:

- `Admin`
- `Doctor`
- `Triage Nurse`
- `Receptionist`
- `Pharmacist`

Each role has scoped access to the modules they require in a clinical workflow.

## Notes

- The application is designed for real clinic operations and patient journey management.
- The frontend and backend are separate applications and can be developed independently.
- Tenant resolution is implemented on the backend, enabling shared-schema multi-tenancy with a `clinic_id` context.

## Contribution

To contribute improvements:

1. Create a branch from `main`.
2. Implement changes in the relevant `backend/` or `frontend/` module.
3. Verify with local dev servers and database state.
4. Submit a pull request with a clear summary.

## License

MIT License
