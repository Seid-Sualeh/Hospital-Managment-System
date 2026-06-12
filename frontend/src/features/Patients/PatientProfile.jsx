import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageShell from "../../components/Common/PageShell";
import StatusBadge from "../../components/Common/StatusBadge";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Common/Modal";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import {
  ArrowLeft,
  Edit,
  Printer,
  Phone,
  Mail,
  MapPin,
  User,
  Droplets,
  AlertTriangle,
} from "lucide-react";

const MOCK_PATIENT = {
  id: 1,
  patient_uid: "PT-00124",
  full_name: "Abebe Kebede",
  gender: "Male",
  age: 34,
  phone: "0911 123456",
  email: "abebe.kebede@email.com",
  address: "Bole, Addis Ababa",
  dob: "1990-03-12",
  blood_group: "O+",
  emergency_contact_name: "Alemu Kebede",
  emergency_contact_phone: "0911 987654",
  status: "active",
  last_visit: "2024-05-15",
  doctor: "Dr. Elias M.",
  diagnosis: "Typhoid Fever",
  visit_type: "General Consultation",
  visit_status: "Completed",
};

const MOCK_VISITS = [
  {
    id: 1,
    date: "2024-05-15",
    doctor: "Dr. Elias M.",
    type: "General Consultation",
    diagnosis: "Typhoid Fever",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-03-10",
    doctor: "Dr. Tigist H.",
    type: "Follow-up",
    diagnosis: "Hypertension",
    status: "completed",
  },
  {
    id: 3,
    date: "2024-01-05",
    doctor: "Dr. Yonas K.",
    type: "Emergency",
    diagnosis: "Acute Gastritis",
    status: "completed",
  },
];

const TABS = [
  "Overview",
  "Visit History",
  "Medical History",
  "Documents",
  "Billing",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, vRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/patients/${id}/visits`),
        ]);
        const p = pRes.data?.data || pRes.data;
        setPatient(p);
        setVisits(vRes.data?.data || vRes.data || []);
      } catch {
        setPatient({ ...MOCK_PATIENT, id });
        setVisits(MOCK_VISITS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const openEdit = () => {
    setForm({ ...patient });
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/patients/${id}`, form);
      setPatient({ ...patient, ...form });
      setAlert({ type: "success", msg: "Patient updated successfully." });
      setShowEdit(false);
    } catch {
      setAlert({ type: "danger", msg: "Update failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading patient..." />;
  if (!patient) return null;

  const p = patient;

  return (
    <PageShell>
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/patients" className="text-decoration-none text-primary">
              Patients
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Patient Profile
          </li>
        </ol>
      </nav>

      {/* Back Button */}
      <button
        className="btn btn-link text-muted p-0 mb-3 d-flex align-items-center gap-1 text-decoration-none"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Patient Header Card */}
      <div className="mc-card mb-4">
        <div className="mc-card-body">
          <div className="d-flex flex-wrap align-items-center gap-4">
            {/* Avatar */}
            <div className="stat-card-icon primary avatar-xl rounded-16 flex-shrink-0">
              {getInitials(p.full_name)}
            </div>

            {/* Info */}
            <div className="flex-grow-1">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h4 className="fw-bold mb-0">{p.full_name}</h4>
                <span className="text-muted small">{p.patient_uid}</span>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge bg-light text-dark border">
                  {p.gender}
                </span>
                <span className="badge bg-light text-dark border">
                  {p.age} Years
                </span>
                <StatusBadge status={p.status || "active"} />
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={openEdit}
              >
                <Edit size={14} /> Edit Patient
              </button>
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab} role="presentation">
            <button
              className={`nav-link ${activeTab === tab ? "active fw-semibold" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="row g-4">
          {/* Personal Information */}
          <div className="col-lg-7">
            <div className="mc-card">
              <div className="mc-card-body">
                <h6 className="text-section-title mb-3">
                  Personal Information
                </h6>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="d-flex gap-2 align-items-start">
                      <Phone size={15} className="text-muted mt-1" />
                      <div>
                        <div className="text-caption">Phone</div>
                        <div className="fw-semibold small">
                          {p.phone || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex gap-2 align-items-start">
                      <Mail size={15} className="text-muted mt-1" />
                      <div>
                        <div className="text-caption">Email</div>
                        <div className="fw-semibold small">
                          {p.email || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex gap-2 align-items-start">
                      <MapPin size={15} className="text-muted mt-1" />
                      <div>
                        <div className="text-caption">Address</div>
                        <div className="fw-semibold small">
                          {p.address || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex gap-2 align-items-start">
                      <Droplets size={15} className="text-muted mt-1" />
                      <div>
                        <div className="text-caption">Blood Group</div>
                        <div className="fw-semibold small">
                          {p.blood_group || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex gap-2 align-items-start">
                      <AlertTriangle size={15} className="text-muted mt-1" />
                      <div>
                        <div className="text-caption">Emergency Contact</div>
                        <div className="fw-semibold small">
                          {p.emergency_contact_name || "—"} &middot;{" "}
                          {p.emergency_contact_phone || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Last Visit Summary */}
          <div className="col-lg-5">
            <div className="mc-card">
              <div className="mc-card-body">
                <h6 className="text-section-title mb-3">Last Visit Summary</h6>
                <div className="d-flex flex-column gap-3">
                  <InfoRow
                    label="Date"
                    value={
                      p.last_visit
                        ? new Date(p.last_visit).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                  <InfoRow label="Doctor" value={p.doctor || "—"} />
                  <InfoRow label="Visit Type" value={p.visit_type || "—"} />
                  <InfoRow label="Diagnosis" value={p.diagnosis || "—"} />
                  <InfoRow
                    label="Status"
                    value={
                      <StatusBadge
                        status={p.visit_status?.toLowerCase() || "completed"}
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Visit History" && (
        <div className="mc-card">
          <div className="mc-card-body">
            <h6 className="text-section-title mb-3">Visit History</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td className="small">
                        {new Date(v.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="small fw-semibold">{v.doctor}</td>
                      <td className="small">{v.type}</td>
                      <td className="small">{v.diagnosis}</td>
                      <td>
                        <StatusBadge status={v.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Medical History" && (
        <div className="mc-card">
          <div className="mc-card-body">
            <h6 className="text-section-title mb-3">Medical History</h6>
            <p className="text-muted small">No medical history recorded yet.</p>
          </div>
        </div>
      )}

      {activeTab === "Documents" && (
        <div className="mc-card">
          <div className="mc-card-body">
            <h6 className="text-section-title mb-3">Documents</h6>
            <p className="text-muted small">No documents uploaded yet.</p>
          </div>
        </div>
      )}

      {activeTab === "Billing" && (
        <div className="mc-card">
          <div className="mc-card-body">
            <h6 className="text-section-title mb-3">Billing History</h6>
            <p className="text-muted small">No billing records found.</p>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      <Modal
        show={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Patient"
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="row g-3">
            {[
              { label: "Full Name", key: "full_name", col: 6, required: true },
              { label: "Phone", key: "phone", col: 6 },
              { label: "Email", key: "email", col: 6, type: "email" },
              { label: "Address", key: "address", col: 6 },
              {
                label: "Emergency Contact",
                key: "emergency_contact_name",
                col: 6,
              },
              {
                label: "Emergency Phone",
                key: "emergency_contact_phone",
                col: 6,
              },
            ].map(({ label, key, col, type, required }) => (
              <div className={`col-md-${col}`} key={key}>
                <label className="mc-form-label">
                  {label}
                  {required && " *"}
                </label>
                <input
                  className="form-control"
                  type={type || "text"}
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={!!required}
                />
              </div>
            ))}
            <div className="col-md-6">
              <label className="mc-form-label">Blood Group</label>
              <select
                className="form-select"
                value={form.blood_group || ""}
                onChange={(e) =>
                  setForm({ ...form, blood_group: e.target.value })
                }
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Update Patient"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
    <span className="text-caption text-muted">{label}</span>
    <span className="fw-semibold small text-end">{value}</span>
  </div>
);

export default PatientProfile;
