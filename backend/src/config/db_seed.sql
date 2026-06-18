-- =================================================================================
-- CLINIC MANAGEMENT SYSTEM (CMS) SAAS FOR ETHIOPIA - DATABASE SEED SCRIPT
-- =================================================================================

USE ethiopia_cms;

-- Disable Foreign Keys during seeding
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing seed data if any
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE clinics;

-- 1. Seed Clinic Tenant
INSERT INTO clinics (id, uuid, name, subdomain, license_number, status)
VALUES (1, '3c59a3c9-0268-450f-a9db-72d659a3fa2f', 'Yared Clinic', 'yared', 'EFDA/MOH/1000213', 'active');

-- 2. Seed System Permissions
INSERT INTO permissions (id, name, code, module) VALUES
(1, 'Manage Clinic Users & Personnel', 'MANAGE_USERS', 'auth'),
(2, 'Register New Patient Profile', 'CREATE_PATIENT', 'patient'),
(3, 'View Patient Profile & Demographics', 'READ_PATIENT', 'patient'),
(4, 'Document Consultation & EMR Encounter', 'CREATE_RECORD', 'emr'),
(5, 'Read Complete Patient EMR Records', 'READ_RECORD', 'emr'),
(6, 'Enter Patient Vital Signs', 'WRITE_VITALS', 'emr'),
(7, 'Generate Invoices & Vouchers', 'GENERATE_INVOICE', 'billing'),
(8, 'Collect Cash/Mobile Payments', 'COLLECT_PAYMENT', 'billing'),
(9, 'Manage Pharmacy & Supplies Inventory', 'MANAGE_STOCK', 'inventory'),
(10, 'View Lab Requests Queue', 'READ_LAB_REQUEST', 'laboratory'),
(11, 'Collect Lab Sample', 'COLLECT_SAMPLE', 'laboratory'),
(12, 'Enter Test Results', 'ENTER_LAB_RESULTS', 'laboratory'),
(13, 'Verify & Approve Lab Results', 'APPROVE_LAB_RESULTS', 'laboratory'),
(14, 'Dispense Prescriptions', 'DISPENSE_MEDICINE', 'pharmacy'),
(15, 'View Financial & Business Reports', 'VIEW_FINANCIALS', 'billing');

-- 3. Seed Default Global and Clinic Roles
-- Clinic Roles (clinic_id = 1)
INSERT INTO roles (id, clinic_id, name, description) VALUES
(1, 1, 'Clinic Administrator', 'Clinic Director with complete control over users and clinic configurations'),
(2, 1, 'Medical Doctor', 'Clinical officer with EMR write access and diagnostics control'),
(3, 1, 'Triage Nurse', 'Nursing officer managing intake, vitals registration, and queues'),
(4, 1, 'Receptionist', 'Front desk officer managing registrations, appointments, and patient search'),
(5, 1, 'Pharmacist', 'Inventory and dispensary controller managing stock levels and distribution'),
(6, 1, 'Laboratory Technician', 'Lab officer managing sample collection, results entry, and report releases'),
(7, 1, 'Cashier', 'Billing officer collecting payments, generating invoices and managing receipts');

-- 4. Map Role Permissions (role_permissions join table)
-- Clinic Administrator: All permissions (1 to 15)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15);

-- Medical Doctor: Patients read/write, EMR write, read record, write vitals, generate invoices (for prescriptions/fees), view lab requests
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 10);

-- Triage Nurse: Patients read/write, write vitals, read EMR
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 2), (3, 3), (3, 5), (3, 6);

-- Receptionist: Patients read/write, demographics (no payment collections)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 2), (4, 3);

-- Pharmacist: Inventory manage, Patients read demographics, EMR read, Dispense medicine
INSERT INTO role_permissions (role_id, permission_id) VALUES
(5, 3), (5, 5), (5, 9), (5, 14);

-- Laboratory Technician: Read patients, read lab requests, collect samples, enter results, approve results
INSERT INTO role_permissions (role_id, permission_id) VALUES
(6, 3), (6, 10), (6, 11), (6, 12), (6, 13);

-- Cashier: Read patients, generate invoice, collect payment, view financial reports
INSERT INTO role_permissions (role_id, permission_id) VALUES
(7, 3), (7, 7), (7, 8), (7, 15);

-- 5. Seed Users
-- Password hash here corresponds to plain password: "Password123!" hashed with bcrypt (rounds 12)
-- $2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG
INSERT INTO users (id, clinic_id, first_name, last_name, email, phone_number, password_hash, role_id, is_active) VALUES
-- Admin User (Role 1)
(1, 1, 'Yared', 'Negash', 'yared@yaredclinic.com', '+251911223344', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 1, TRUE),
-- Doctor User (Role 2)
(2, 1, 'Almaz', 'Bekele', 'almaz@yaredclinic.com', '+251911998877', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 2, TRUE),
-- Receptionist User (Role 4)
(3, 1, 'Lidya', 'Tadesse', 'lidya@yaredclinic.com', '+251912445566', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 4, TRUE),
-- Laboratory Technician User (Role 6)
(4, 1, 'Samuel', 'Chala', 'samuel@yaredclinic.com', '+251913778899', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 6, TRUE),
-- Cashier User (Role 7)
(5, 1, 'Kebede', 'Tolosa', 'kebede@yaredclinic.com', '+251914112233', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 7, TRUE),
-- Pharmacist User (Role 5)
(6, 1, 'Tigist', 'Mulu', 'tigist@yaredclinic.com', '+251915667788', '$2a$12$57elWN3a/CmIkeQ.IDQu1.eHWkMZIj9qZ7xSM4R1zeVjXDYYRkZAG', 5, TRUE);

-- 6. Seed a Default Patient for Testing
INSERT INTO patients (id, clinic_id, mrn, first_name, middle_name, last_name, gender, dob_gregorian, dob_ethiopian, phone_number, address) VALUES
(1, 1, 'YR-10001', 'Kassa', 'Mulugeta', 'Gizaw', 'M', '1985-09-12', '1978-01-02', '+251911000011', 'Bole Subcity, Woreda 03, House 405, Addis Ababa');

-- 7. Seed Medicines & Batches
INSERT INTO medicines (id, clinic_id, name, generic_name, strength, dosage_form, sku, quantity_in_stock, reorder_level, unit_price, is_active) VALUES
(1, 1, 'Amoxicillin 500mg', 'Amoxicillin', '500mg', 'Capsule', 'SKU-AMOX-500', 100, 20, 5.50, TRUE),
(2, 1, 'Paracetamol 500mg', 'Paracetamol', '500mg', 'Tablet', 'SKU-PARA-500', 500, 50, 1.20, TRUE);

INSERT INTO medicine_batches (id, clinic_id, medicine_id, batch_number, expiry_date, quantity_received, quantity_remaining, unit_cost) VALUES
(1, 1, 1, 'BATCH-AMOX-001', '2027-06-01', 100, 100, 3.00),
(2, 1, 2, 'BATCH-PARA-001', '2026-12-31', 500, 500, 0.50);

-- 8. Seed Corporate Sponsors
INSERT INTO corporate_sponsors (id, clinic_id, name, contact_person, email, phone_number, billing_cycle, discount_rate, is_active) VALUES
(1, 1, 'Ethiopian Airlines', 'Abebe Kebede', 'medical@ethiopianairlines.com', '+251116656666', 'monthly', 10.00, TRUE),
(2, 1, 'Commercial Bank of Ethiopia', 'Tewodros Assefa', 'cbe_health@cbe.com.et', '+251115515004', 'monthly', 5.00, TRUE);

-- 9. Seed Corporate Patient Profile
INSERT INTO patient_corporate_profiles (patient_id, clinic_id, sponsor_id, employee_id, coverage_limit, copay_percentage) VALUES
(1, 1, 1, 'EAL-99827', 50000.00, 10.00);

-- Enable Foreign Keys
SET FOREIGN_KEY_CHECKS = 1;
