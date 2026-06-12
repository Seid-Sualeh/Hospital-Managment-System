-- =================================================================================
-- CLINIC MANAGEMENT SYSTEM (CMS) SAAS FOR ETHIOPIA - DATABASE INITIALIZATION SCRIPT
-- Database Engine: MySQL 8.x + (InnoDB Storage Engine)
-- Tenancy Architecture: Shared Database, Shared Schema with ForeignKey 'clinic_id'
-- =================================================================================

CREATE DATABASE IF NOT EXISTS ethiopia_cms;
USE ethiopia_cms;

-- Disable Foreign Key checks temporarily to prevent order-of-creation lock issues
SET FOREIGN_KEY_CHECKS = 0;

-- =================================================================================
-- 1. CLINICS (Tenant Registry)
-- =================================================================================
DROP TABLE IF EXISTS clinics;
CREATE TABLE clinics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(50) NOT NULL UNIQUE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'suspended', 'trial') NOT NULL DEFAULT 'trial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clinics_subdomain (subdomain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 1B. CORPORATE SPONSORS (Corporate Registry)
-- =================================================================================
DROP TABLE IF EXISTS corporate_sponsors;
CREATE TABLE corporate_sponsors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone_number VARCHAR(15) DEFAULT NULL,
    billing_cycle ENUM('weekly', 'monthly', 'quarterly') NOT NULL DEFAULT 'monthly',
    discount_rate DECIMAL(4,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_corp_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_clinic_sponsor (clinic_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 2. ROLES (RBAC Model)
-- =================================================================================
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED DEFAULT NULL, -- NULL denotes global system-defined roles, non-NULL is clinic-specific
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_roles_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_clinic_role (clinic_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 3. PERMISSIONS (RBAC Actions)
-- =================================================================================
DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 4. ROLE_PERMISSIONS (RBAC Join Table)
-- =================================================================================
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 5. USERS (Clinic Employees / Clinicians)
-- =================================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_clinic_email (clinic_id, email),
    UNIQUE KEY uq_phone (phone_number),
    INDEX idx_user_clinic (clinic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 6. PATIENTS (Demographics Registry)
-- =================================================================================
DROP TABLE IF EXISTS patients;
CREATE TABLE patients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    mrn VARCHAR(50) NOT NULL, -- Medical Record Number unique within a clinic
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('M', 'F') NOT NULL,
    dob_gregorian DATE NOT NULL,
    dob_ethiopian VARCHAR(10) DEFAULT NULL, -- Ge'ez calendar string caching
    phone_number VARCHAR(15) DEFAULT NULL,
    sub_city VARCHAR(100) DEFAULT NULL,
    woreda VARCHAR(50) DEFAULT NULL,
    kebele VARCHAR(50) DEFAULT NULL,
    house_number VARCHAR(50) DEFAULT NULL,
    fayda_id VARCHAR(15) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    emergency_contact_name VARCHAR(100) DEFAULT NULL,
    emergency_contact_phone VARCHAR(15) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_clinic_mrn (clinic_id, mrn),
    UNIQUE KEY uq_clinic_fayda (clinic_id, fayda_id),
    INDEX idx_patients_name (first_name, last_name),
    INDEX idx_patients_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 6B. PATIENT CORPORATE PROFILES (Corporate Subscriptions)
-- =================================================================================
DROP TABLE IF EXISTS patient_corporate_profiles;
CREATE TABLE patient_corporate_profiles (
    patient_id INT UNSIGNED PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    sponsor_id INT UNSIGNED NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    coverage_limit DECIMAL(12,2) DEFAULT NULL,
    copay_percentage DECIMAL(5,2) DEFAULT 0.00,
    authorization_letter_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pcp_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_pcp_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pcp_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES corporate_sponsors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 6C. TRIAGE RECORDS (Separates triage vitals from doctor encounters)
-- =================================================================================
DROP TABLE IF EXISTS triage_records;
CREATE TABLE triage_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    nurse_id INT UNSIGNED NOT NULL,
    temperature DECIMAL(4,1) DEFAULT NULL,    -- °C
    blood_pressure_sys INT UNSIGNED DEFAULT NULL, -- mmHg
    blood_pressure_dia INT UNSIGNED DEFAULT NULL, -- mmHg
    pulse_rate INT UNSIGNED DEFAULT NULL,         -- bpm
    respiratory_rate INT UNSIGNED DEFAULT NULL,   -- bpm
    oxygen_saturation DECIMAL(5,2) DEFAULT NULL,  -- SpO2 %
    weight DECIMAL(5,2) DEFAULT NULL,             -- kg
    height DECIMAL(5,2) DEFAULT NULL,             -- cm
    bmi DECIMAL(4,1) DEFAULT NULL,
    triage_level ENUM('red', 'orange', 'yellow', 'green', 'blue') NOT NULL DEFAULT 'green', -- Emergency severity index
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_triage_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_triage_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_triage_nurse_id FOREIGN KEY (nurse_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 7. VISITS (Visit Workflow Management)
-- =================================================================================
DROP TABLE IF EXISTS visits;
CREATE TABLE visits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    created_by INT UNSIGNED NOT NULL, -- Receptionist who registered patient
    doctor_id INT UNSIGNED DEFAULT NULL, -- Assigned doctor
    visit_date DATE NOT NULL,
    visit_status ENUM(
        'REGISTERED',
        'CONSULTATION_PAID',
        'WAITING_DOCTOR',
        'LAB_PAYMENT_PENDING',
        'LAB_PAID',
        'IN_LABORATORY',
        'LAB_COMPLETED',
        'PRESCRIPTION_CREATED',
        'MEDICATION_PAYMENT_PENDING',
        'MEDICATION_PAID',
        'DISPENSED',
        'CLOSED'
    ) NOT NULL DEFAULT 'REGISTERED',
    triage_record_id INT UNSIGNED DEFAULT NULL,
    consultation_id INT UNSIGNED DEFAULT NULL,
    lab_request_id INT UNSIGNED DEFAULT NULL,
    prescription_id INT UNSIGNED DEFAULT NULL,
    invoice_id INT UNSIGNED DEFAULT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    reason_for_visit TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_visits_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_visits_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_visits_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_visit_clinic_date (clinic_id, visit_date),
    INDEX idx_visit_patient (patient_id, visit_date),
    INDEX idx_visit_status (visit_status),
    INDEX idx_visit_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 7A. QUEUE_ENTRIES (Visit Queue Management)
-- =================================================================================
DROP TABLE IF EXISTS queue_entries;
CREATE TABLE queue_entries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    visit_id INT UNSIGNED NOT NULL,
    queue_type ENUM('CONSULTATION', 'LABORATORY', 'PHARMACY') NOT NULL,
    queue_position INT UNSIGNED NOT NULL DEFAULT 0,
    assigned_to INT UNSIGNED DEFAULT NULL,
    status ENUM('WAITING', 'IN_SERVICE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    wait_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_start_time TIMESTAMP NULL DEFAULT NULL,
    service_end_time TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_queue_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_queue_visit_id FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_queue_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_queue_clinic_type_status (clinic_id, queue_type, status),
    INDEX idx_queue_visit (visit_id),
    INDEX idx_queue_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 7B. APPOINTMENTS (Booking Queue)
-- =================================================================================
DROP TABLE IF EXISTS appointments;
CREATE TABLE appointments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    appointment_datetime DATETIME NOT NULL,
    reason_for_visit TEXT DEFAULT NULL,
    status ENUM('scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_appt_datetime (appointment_datetime),
    INDEX idx_appt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 8. CONSULTATIONS (Encounter Diagnostics & Vitals)
-- =================================================================================
DROP TABLE IF EXISTS consultations;
CREATE TABLE consultations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    appointment_id INT UNSIGNED DEFAULT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    consultation_datetime DATETIME NOT NULL,
    vitals JSON DEFAULT NULL, -- Schema validation for vital parameters
    chief_complaints TEXT NOT NULL,
    history_of_present_illness TEXT DEFAULT NULL,
    physical_examination TEXT DEFAULT NULL,
    diagnoses JSON DEFAULT NULL, -- Standardized ICD-10 objects array
    clinical_notes TEXT DEFAULT NULL,
    status ENUM('in_progress', 'completed', 'referred') NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_consultations_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultations_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_consultations_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_consultations_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_consultations_date (consultation_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 8B. MEDICAL CERTIFICATES (Yekim Woreket)
-- =================================================================================
DROP TABLE IF EXISTS medical_certificates;
CREATE TABLE medical_certificates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    consultation_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    serial_number VARCHAR(50) NOT NULL, -- Legal tracking sequence
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sick_leave_days INT UNSIGNED NOT NULL,
    diagnosis_notes TEXT DEFAULT NULL, -- Redacted or simple clinical reason
    verification_token VARCHAR(64) NOT NULL UNIQUE, -- QR code lookup token
    status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mc_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mc_consultation_id FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_clinic_serial (clinic_id, serial_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 9. MEDICINES (Pharmacy Catalog)
-- =================================================================================
DROP TABLE IF EXISTS medicines;
CREATE TABLE medicines (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    sku VARCHAR(50) DEFAULT NULL,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    unit_price DECIMAL(10,2) NOT NULL,
    expiry_date DATE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicines_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_clinic_sku (clinic_id, sku),
    INDEX idx_medicines_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 9B. MEDICINE BATCHES (Batch & Expiry Controls)
-- =================================================================================
DROP TABLE IF EXISTS medicine_batches;
CREATE TABLE medicine_batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INT NOT NULL,
    quantity_remaining INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mb_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mb_medicine_id FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    UNIQUE KEY uq_clinic_batch (clinic_id, medicine_id, batch_number),
    INDEX idx_mb_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 10. PRESCRIPTIONS (Dispensary Requests)
-- =================================================================================
DROP TABLE IF EXISTS prescriptions;
CREATE TABLE prescriptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    consultation_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    prescribed_date DATE NOT NULL,
    instructions JSON NOT NULL, -- List of medications, directions and counts
    status ENUM('pending', 'partially_dispensed', 'dispensed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescriptions_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_consultation_id FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_prescriptions_date (prescribed_date),
    INDEX idx_prescriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 11. LAB_REQUESTS (Laboratory Panels)
-- =================================================================================
DROP TABLE IF EXISTS lab_requests;
CREATE TABLE lab_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    consultation_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    request_date DATETIME NOT NULL,
    test_names JSON NOT NULL, -- Array of string names of tests requested
    status ENUM('ordered', 'samples_collected', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lr_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lr_consultation_id FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_doctor_id FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_lab_requests_date (request_date),
    INDEX idx_lab_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 12. LAB_RESULTS (Diagnostic Findings)
-- =================================================================================
DROP TABLE IF EXISTS lab_results;
CREATE TABLE lab_results (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    lab_request_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    technician_id INT UNSIGNED NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    results_json JSON NOT NULL, -- Diagnostic metrics measurements
    technician_notes TEXT DEFAULT NULL,
    result_date DATETIME NOT NULL,
    file_attachment_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lres_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lres_lab_request_id FOREIGN KEY (lab_request_id) REFERENCES lab_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_lres_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_lres_technician_id FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_lab_results_date (result_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 13. INVENTORY_TRANSACTIONS (Medication Audits)
-- =================================================================================
DROP TABLE IF EXISTS inventory_transactions;
CREATE TABLE inventory_transactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    transaction_type ENUM('purchase_receipt', 'dispense', 'adjustment_loss', 'adjustment_gain', 'return') NOT NULL,
    quantity INT NOT NULL, -- Positive for stock additions, negative for dispensations
    unit_cost DECIMAL(10,2) DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,
    performed_by INT UNSIGNED NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_it_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_it_medicine_id FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    CONSTRAINT fk_it_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_inv_transactions_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 14. INVOICES (Billing Vouchers)
-- =================================================================================
DROP TABLE IF EXISTS invoices;
CREATE TABLE invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    visit_id INT UNSIGNED DEFAULT NULL,
    sponsor_id INT UNSIGNED DEFAULT NULL,
    issued_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL,
    copay_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sponsor_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('unpaid', 'partially_paid', 'paid', 'void') NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_visit_id FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES corporate_sponsors(id) ON DELETE RESTRICT,
    INDEX idx_invoices_date (issued_date),
    INDEX idx_invoices_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 15. INVOICE_ITEMS (Billing Breakdowns)
-- =================================================================================
DROP TABLE IF EXISTS invoice_items;
CREATE TABLE invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    invoice_id INT UNSIGNED NOT NULL,
    item_type ENUM('consultation', 'laboratory', 'pharmacy', 'procedure', 'other') NOT NULL,
    item_reference_id INT UNSIGNED DEFAULT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_ii_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ii_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 16. PAYMENTS (Transactions Cash / Online)
-- =================================================================================
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    invoice_id INT UNSIGNED NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'telebirr', 'chapa', 'bank_transfer', 'cbe_birr') NOT NULL,
    transaction_reference VARCHAR(100) DEFAULT NULL, -- ID reference from Telebirr / Chapa Gateway APIs
    payment_status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT UNSIGNED DEFAULT NULL,
    CONSTRAINT fk_payments_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_payment_ref (transaction_reference),
    INDEX idx_payments_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 17. NOTIFICATIONS (Communication Log)
-- =================================================================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    recipient_type ENUM('user', 'patient') NOT NULL,
    recipient_id INT UNSIGNED NOT NULL,
    notification_type ENUM('sms', 'email', 'in_app') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
    retry_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_recipient (recipient_type, recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 18. AUDIT_LOGS (Security Compliance Logs)
-- =================================================================================
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED DEFAULT NULL, -- NULL indicates global onboarding or administration action
    user_id INT UNSIGNED DEFAULT NULL,
    action_type VARCHAR(50) NOT NULL, -- "LOGIN", "VIEW_EMR", "DISPENSE_MEDICINE"
    affected_table VARCHAR(100) NOT NULL,
    affected_record_id BIGINT UNSIGNED DEFAULT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_al_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
    CONSTRAINT fk_al_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_action (action_type),
    INDEX idx_audit_logs_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enable Foreign Key checks back
SET FOREIGN_KEY_CHECKS = 1;
