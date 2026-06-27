-- Clinic settings storage (run after db_init.sql)
USE ethiopia_cms;

CREATE TABLE IF NOT EXISTS clinic_settings (
    clinic_id INT UNSIGNED PRIMARY KEY,
    settings_json JSON NOT NULL,
    logo_url TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
