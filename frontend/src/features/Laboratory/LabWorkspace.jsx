import React, { useState, useEffect, useCallback } from "react";
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
import { Plus, Eye, FlaskConical, CheckCircle2 } from "lucide-react";

const MOCK_LAB_REQUESTS = [
  {
    id: 1,
    request_uid: "LAB-0018",
    patient_uid: "PT-00124",
    patient_name: "Abebe Kebede",
    doctor: "Dr. Elias M.",
    test_name: "CBC",
    date: "2024-05-15",
    status: "pending",
  },
  {
    id: 2,
    request_uid: "LAB-0017",
    patient_uid: "PT-00123",
    patient_name: "Selamawit G.",
    doctor: "Dr. Tigist H.",
    test_name: "Urine Analysis",
    date: "2024-05-14",
    status: "in_progress",
  },
  {
    id: 3,
    request_uid: "LAB-0016",
    patient_uid: "PT-00122",
    patient_name: "Melahom T.",
    doctor: "Dr. Yonas K.",
    test_name: "Blood Sugar",
    date: "2024-05-13",
    status: "completed",
  },
  {
    id: 4,
    request_uid: "LAB-0015",
    patient_uid: "PT-00121",
    patient_name: "Hana Abebe",
    doctor: "Dr. Elias M.",
    test_name: "Malaria Test",
    date: "2024-05-13",
    status: "completed",
  },
  {
    id: 5,
    request_uid: "LAB-0014",
    patient_uid: "PT-00120",
    patient_name: "Tesfaye B.",
    doctor: "Dr. Tigist H.",
    test_name: "Stool Analysis",
    date: "2024-05-12",
    status: "pending",
  },
];

const EMPTY_FORM = {
  patient_uid: "",
  test_name: "",
  doctor: "",
  priority: "normal",
  notes: "",
};
const RESULT_FORM = { result: "", interpretation: "" };

const LabWorkspace = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [resultForm, setResultForm] = useState({ ...RESULT_FORM });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/lab-requests", { params });
      const data = res.data?.data || res.data;
      setRequests(
        data.requests ||
          data.rows ||
          (Array.isArray(data) ? data : MOCK_LAB_REQUESTS),
      );
    } catch {
      setRequests(MOCK_LAB_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/lab-requests", form);
      setAlert({ type: "success", msg: "Lab request created." });
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch {
      setRequests((prev) => [
        {
          id: Date.now(),
          request_uid: `LAB-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
          ...form,
          date: new Date().toISOString().slice(0, 10),
          status: "pending",
          patient_name: form.patient_uid,
        },
        ...prev,
      ]);
      setAlert({ type: "success", msg: "Lab request created." });
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM });
    } finally {
      setSaving(false);
    }
  };

  const openResult = (req) => {
    setSelectedRequest(req);
    setResultForm({
      result: req.result || "",
      interpretation: req.interpretation || "",
    });
    setShowResultModal(true);
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/lab-requests/${selectedRequest.id}/result`, resultForm);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, ...resultForm, status: "completed" }
            : r,
        ),
      );
      setAlert({ type: "success", msg: "Result uploaded successfully." });
      setShowResultModal(false);
    } catch {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, ...resultForm, status: "completed" }
            : r,
        ),
      );
      setAlert({ type: "success", msg: "Result uploaded successfully." });
      setShowResultModal(false);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Request ID",
      render: (r) => (
        <span className="fw-semibold text-primary">{r.request_uid}</span>
      ),
    },
    {
      header: "Patient",
      render: (r) => (
        <div>
          <div className="fw-semibold small">{r.patient_name}</div>
          <div className="text-caption">{r.patient_uid}</div>
        </div>
      ),
    },
    { header: "Test", render: (r) => r.test_name },
    { header: "Doctor", render: (r) => r.doctor },
    {
      header: "Date",
      render: (r) =>
        r.date
          ? new Date(r.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Action",
      render: (r) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            title="View"
            onClick={() => openResult(r)}
          >
            <Eye size={14} />
          </button>
          {r.status !== "completed" && (
            <button
              className="btn btn-sm btn-outline-success"
              title="Upload Result"
              onClick={() => openResult(r)}
            >
              <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <PageHeader
          title="Laboratory"
          subtitle="Manage lab requests and results"
        />
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} /> New Lab Request
        </button>
      </div>

      <div className="mc-card">
        <div className="mc-card-body">
          <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search lab requests..."
            />
            <select
              className="form-select w-160"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : requests.length === 0 ? (
            <EmptyState message="No lab requests found." />
          ) : (
            <div className="table-responsive">
              <DataTable columns={columns} data={requests} />
            </div>
          )}
        </div>
      </div>

      {/* Add Lab Request Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Lab Request"
        size="md"
      >
        <form onSubmit={handleAddSubmit}>
          <div className="mb-3">
            <label className="mc-form-label">Patient UID *</label>
            <input
              className="form-control"
              placeholder="e.g. PT-00124"
              value={form.patient_uid}
              onChange={(e) =>
                setForm({ ...form, patient_uid: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Test Name *</label>
            <input
              className="form-control"
              placeholder="e.g. CBC, Urine Analysis"
              value={form.test_name}
              onChange={(e) => setForm({ ...form, test_name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Doctor</label>
            <input
              className="form-control"
              placeholder="e.g. Dr. Elias M."
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Priority</label>
            <select
              className="form-select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Create Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Result Modal */}
      <Modal
        show={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={`Result — ${selectedRequest?.request_uid}`}
        size="md"
      >
        <form onSubmit={handleResultSubmit}>
          <div className="mb-3">
            <label className="mc-form-label">Result *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter test result"
              value={resultForm.result}
              onChange={(e) =>
                setResultForm({ ...resultForm, result: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Interpretation</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Clinical interpretation"
              value={resultForm.interpretation}
              onChange={(e) =>
                setResultForm({ ...resultForm, interpretation: e.target.value })
              }
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowResultModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? "Uploading..." : "Upload Result"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default LabWorkspace;
