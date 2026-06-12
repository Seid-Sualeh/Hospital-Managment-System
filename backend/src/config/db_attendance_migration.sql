-- =================================================================================
-- CLINIC MANAGEMENT SYSTEM (CMS) - ATTENDANCE & WORKFORCE MANAGEMENT MIGRATION
-- =================================================================================

USE ethiopia_cms;

-- Disable foreign keys check during execution
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create staff_shifts Table
CREATE TABLE IF NOT EXISTS staff_shifts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT UNSIGNED NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_shifts_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_clinic_shift_name (clinic_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Alter users Table to link to shifts (if shift_id doesn't exist)
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "shift_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN shift_id INT UNSIGNED DEFAULT NULL AFTER role_id, ADD CONSTRAINT fk_users_shift_id FOREIGN KEY (shift_id) REFERENCES staff_shifts(id) ON DELETE SET NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Create leave_types Table
CREATE TABLE IF NOT EXISTS leave_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    days_allowed INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_types_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_clinic_leave_type (clinic_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create staff_attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    work_date DATE NOT NULL,
    check_in TIMESTAMP NULL DEFAULT NULL,
    check_out TIMESTAMP NULL DEFAULT NULL,
    status ENUM('Present', 'Absent', 'Late', 'Half Day', 'On Leave') NOT NULL DEFAULT 'Absent',
    worked_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_offsite BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(255) DEFAULT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_clinic_user_date (clinic_id, user_id, work_date),
    INDEX idx_attendance_date (work_date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create leave_requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    leave_type_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by INT UNSIGNED DEFAULT NULL,
    comments VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_leave_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_type_id FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_leave_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leave_dates (start_date, end_date),
    INDEX idx_leave_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Seed Default Shifts for Clinic 1
INSERT IGNORE INTO staff_shifts (id, clinic_id, name, start_time, end_time, grace_period_minutes) VALUES
(1, 1, 'Standard Day Shift', '08:00:00', '17:30:00', 15),
(2, 1, 'Morning Shift', '08:00:00', '12:30:00', 15),
(3, 1, 'Afternoon Shift', '13:30:00', '17:30:00', 15),
(4, 1, 'Night Duty Shift', '17:30:00', '08:00:00', 30);

-- 7. Seed Default Leave Types for Clinic 1
INSERT IGNORE INTO leave_types (id, clinic_id, name, description, days_allowed) VALUES
(1, 1, 'Annual Leave', 'Standard paid yearly leave', 16),
(2, 1, 'Sick Leave', 'Medical absence leave', 15),
(3, 1, 'Maternity Leave', 'Maternal delivery paid leave', 90),
(4, 1, 'Paternity Leave', 'Paternal child birth leave', 5),
(5, 1, 'Compassionate Leave', 'Family emergency/mourning leave', 3);

-- 8. Seed Midwife role in roles table
INSERT IGNORE INTO roles (id, clinic_id, name, description) VALUES
(8, 1, 'Midwife', 'Midwifery specialist managing maternal checkups, deliveries and ANC');

-- 9. Add Midwife permissions mapping
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(8, 2), (8, 3), (8, 4), (8, 5), (8, 6); -- Demographics, EMR record and vitals access

-- Enable foreign keys check back
SET FOREIGN_KEY_CHECKS = 1;
