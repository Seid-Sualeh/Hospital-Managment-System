-- Production Index Hardening Migrations

-- 1. Optimize audit logs querying by clinic and user
CREATE INDEX idx_al_clinic_user ON audit_logs (clinic_id, user_id);

-- 2. Optimize lab results retrieval by request
CREATE INDEX idx_lres_clinic_req ON lab_results (clinic_id, lab_request_id);

-- 3. Optimize payments retrieval by invoice
CREATE INDEX idx_payments_invoice ON payments (invoice_id);

-- 4. Optimize invoice items details retrieval
CREATE INDEX idx_ii_invoice ON invoice_items (invoice_id);

-- 5. Optimize visits list queries by doctor and status
CREATE INDEX idx_visits_doc_status ON visits (doctor_id, visit_status);
