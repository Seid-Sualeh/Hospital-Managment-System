import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/Common/PageShell";
import PageHeader from "../../components/Common/PageHeader";
import SearchInput from "../../components/Common/SearchInput";
import DataTable from "../../components/Common/DataTable";
import StatusBadge from "../../components/Common/StatusBadge";
import Modal from "../../components/Common/Modal";
import Loader from "../../components/Common/Loader";
import EmptyState from "../../components/Common/EmptyState";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import { Plus, Eye, Edit } from "lucide-react";

const MOCK_PATIENTS = [
  {
    id: 1,
    patient_uid: "PT-00124",
    full_name: "Abebe Kebede",
    gender: "Male",
    age: 34,
    phone: "0911 123456",
    last_visit: "2024-05-15",
    status: "active",
  },
  {
    id: 2,
    patient_uid: "PT-00123",
    full_name: "Selamawit G.",
    gender: "Female",
    age: 28,
    phone: "0927 654321",
    last_visit: "2024-05-14",
    status: "active",
  },
  {
    id: 3,
    patient_uid: "PT-00122",
    full_name: "Melahom T.",
    gender: "Male",
    age: 45,
    phone: "0953 011133",
    last_visit: "2024-05-13",
    status: "active",
  },
  {
    id: 4,
    patient_uid: "PT-00121",
    full_name: "Hana Abebe",
    gender: "Female",
    age: 32,
    phone: "0944 556677",
    last_visit: "2024-05-13",
    status: "active",
  },
  {
    id: 5,
    patient_uid: "PT-00120",
    full_name: "Tesfaye B.",
    gender: "Male",
    age: 50,
    phone: "0950 088977",
    last_visit: "2024-05-13",
    status: "active",
  },
];

const PatientManagement = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_group: "",
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (genderFilter) params.gender = genderFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/patients", { params });
      const d = res.data?.data || res.data;
      setPatients(d.patients || d.rows || []);
      setTotalPages(d.totalPages || 1);
    } catch {
      setPatients(MOCK_PATIENTS);
      setTotalPages(5);
    } finally {
      setLoading(false);
    }
  }, [page, search, genderFilter, statusFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const openAdd = () => {
    setEditPatient(null);
    setForm({
      full_name: "",
      gender: "",
      phone: "",
      email: "",
      dob: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      blood_group: "",
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPatient(p);
    setForm({
      full_name: p.full_name || "",
      gender: p.gender || "",
      phone: p.phone || "",
      email: p.email || "",
      dob: p.dob?.slice(0, 10) || "",
      address: p.address || "",
      emergency_contact_name: p.emergency_contact_name || "",
      emergency_contact_phone: p.emergency_contact_phone || "",
      blood_group: p.blood_group || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editPatient) {
        await api.put(`/patients/${editPatient.id}`, form);
        setAlert({ type: "success", msg: "Patient updated successfully." });
      } else {
        await api.post("/patients", form);
        setAlert({ type: "success", msg: "Patient registered successfully." });
      }
      setShowModal(false);
      loadPatients();
    } catch (err) {
      setAlert({
        type: "danger",
        msg: err.apiError?.message || "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "ID",
      render: (r) => r.patient_uid || `PT-${String(r.id).padStart(5, "0")}`,
    },
    { header: "Name", render: (r) => r.full_name },
    { header: "Gender", render: (r) => r.gender },
    { header: "Age", render: (r) => r.age || "—" },
    { header: "Phone", render: (r) => r.phone || "—" },
    {
      header: "Last Visit",
      render: (r) =>
        r.last_visit
          ? new Date(r.last_visit).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    {
      header: "Status",
      render: (r) => <StatusBadge status={r.status || "active"} />,
    },
    {
      header: "Action",
      render: (r) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate(`/patients/${r.id}`)}
          >
            <Eye size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => openEdit(r)}
          >
            <Edit size={14} />
          </button>
        </div>
      ),
    },
  ];

  const totalResults = totalPages * 10;

  return (
    <PageShell>
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-section">
        <PageHeader title="Patients" />
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={openAdd}
        >
          <Plus size={16} /> Add New Patient
        </button>
      </div>

      <div className="mc-card">
        <div className="mc-card-body">
          {/* Filters */}
          <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search patients..."
            />
            <select
              className="form-select w-140"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              className="form-select w-140"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <Loader />
          ) : patients.length === 0 ? (
            <EmptyState message="No patients found." />
          ) : (
            <>
              <div className="table-responsive">
                <DataTable columns={columns} data={patients} />
              </div>
              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-caption">
                  Showing 1 to {patients.length} of {totalResults} results
                </span>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ‹
                      </button>
                    </li>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                      <li
                        key={i}
                        className={`page-item ${page === i + 1 ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${page >= totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage((p) => p + 1)}
                      >
                        ›
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editPatient ? "Edit Patient" : "Register Patient"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="mc-form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Gender *</label>
              <select
                className="form-select"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Phone</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Date of Birth</label>
              <input
                className="form-control"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Blood Group</label>
              <select
                className="form-select"
                value={form.blood_group}
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
            <div className="col-12">
              <label className="mc-form-label">Address</label>
              <input
                className="form-control"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Emergency Contact</label>
              <input
                className="form-control"
                value={form.emergency_contact_name}
                onChange={(e) =>
                  setForm({ ...form, emergency_contact_name: e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="mc-form-label">Emergency Phone</label>
              <input
                className="form-control"
                value={form.emergency_contact_phone}
                onChange={(e) =>
                  setForm({ ...form, emergency_contact_phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editPatient ? "Update" : "Register"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default PatientManagement;
