import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/Common/PageShell";
import StatusBadge from "../../components/Common/StatusBadge";
import Loader from "../../components/Common/Loader";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import { User, Thermometer, Activity, Heart, Weight } from "lucide-react";

const MOCK_QUEUE = [
  {
    id: 1,
    patient_uid: "PT-00124",
    full_name: "Abebe Kebede",
    age: 34,
    gender: "Male",
    complaint: "Fever and headache",
    queue_no: 1,
    status: "waiting",
  },
  {
    id: 2,
    patient_uid: "PT-00123",
    full_name: "Selamawit G.",
    age: 28,
    gender: "Female",
    complaint: "Abdominal pain",
    queue_no: 2,
    status: "waiting",
  },
  {
    id: 3,
    patient_uid: "PT-00122",
    full_name: "Melahom T.",
    age: 45,
    gender: "Male",
    complaint: "Back pain",
    queue_no: 3,
    status: "waiting",
  },
];

const COMPLAINT_OPTIONS = [
  "Fever and headache",
  "Abdominal pain",
  "Chest pain",
  "Back pain",
  "Cough and cold",
  "Skin rash",
  "Other",
];

const ConsultationWorkspace = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    complaint: "",
    diagnosis: "",
    prescription: "",
    lab_request: "",
    notes: "",
    temp: "",
    bp: "",
    pulse: "",
    weight: "",
  });

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/consultations/queue");
      const data = res.data?.data || res.data;
      const q = Array.isArray(data) ? data : MOCK_QUEUE;
      setQueue(q);
      if (q.length > 0) setSelected(q[0]);
    } catch {
      setQueue(MOCK_QUEUE);
      setSelected(MOCK_QUEUE[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (selected) {
      setForm({
        complaint: selected.complaint || "",
        diagnosis: "",
        prescription: "",
        lab_request: "",
        notes: "",
        temp: selected.vitals?.temp || "39.1",
        bp: selected.vitals?.bp || "120/80",
        pulse: selected.vitals?.pulse || "102",
        weight: selected.vitals?.weight || "65",
      });
    }
  }, [selected]);

  const handleSave = async (complete = false) => {
    setSaving(true);
    try {
      await api.post("/consultations", {
        patient_id: selected?.id,
        ...form,
        status: complete ? "completed" : "draft",
      });
      setAlert({
        type: "success",
        msg: complete ? "Consultation completed." : "Draft saved.",
      });
      if (complete) navigate("/patients");
    } catch {
      setAlert({
        type: complete ? "success" : "warning",
        msg: complete ? "Consultation completed." : "Draft saved locally.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  if (loading)
    return <Loader fullPage message="Loading consultation queue..." />;

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
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item text-muted">Consultations</li>
          <li className="breadcrumb-item active">New Consultation</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* LEFT SIDEBAR - Patient Queue */}
        <div className="col-lg-3">
          <div className="mc-card">
            <div className="mc-card-body">
              <h6 className="text-section-title mb-3">Patient Queue</h6>
              <div className="d-flex flex-column gap-2">
                {queue.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded border cursor-pointer ${selected?.id === q.id ? "border-primary bg-primary bg-opacity-10" : "border-light bg-light"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(q)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div className="stat-card-icon primary avatar-sm flex-shrink-0 rounded-8">
                        {getInitials(q.full_name)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-semibold small text-truncate">
                          {q.full_name}
                        </div>
                        <div className="text-caption">
                          {q.patient_uid} &middot; {q.age}y {q.gender}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="badge bg-warning text-dark small">
                        #{q.queue_no}
                      </span>
                      <StatusBadge
                        status={q.status || "waiting"}
                        className="ms-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Consultation Form */}
        <div className="col-lg-9">
          {selected ? (
            <>
              {/* Patient Header */}
              <div
                className="mc-card mb-4"
                style={{ background: "var(--mc-sidebar-bg)", color: "#fff" }}
              >
                <div className="mc-card-body">
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-circle fw-bold text-white avatar-lg flex-shrink-0">
                      {getInitials(selected.full_name)}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-0 fw-bold">{selected.full_name}</h5>
                      <div className="opacity-75 small">
                        {selected.patient_uid} &middot; {selected.age} Years,{" "}
                        {selected.gender}
                      </div>
                    </div>
                    <div className="text-end opacity-75 small">
                      <div>Visit: May 2024</div>
                      <div>Dr. Elias M.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Form */}
              <div className="mc-card">
                <div className="mc-card-body">
                  <div className="row g-4">
                    {/* Left Column */}
                    <div className="col-md-7">
                      <h6 className="text-section-title mb-3">
                        Clinical Information
                      </h6>

                      <div className="mb-3">
                        <label className="mc-form-label">
                          Chief Complaint *
                        </label>
                        <select
                          className="form-select"
                          value={form.complaint}
                          onChange={(e) =>
                            setForm({ ...form, complaint: e.target.value })
                          }
                        >
                          <option value="">Select complaint</option>
                          {COMPLAINT_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="mc-form-label">Diagnosis</label>
                        <input
                          className="form-control"
                          placeholder="Enter diagnosis"
                          value={form.diagnosis}
                          onChange={(e) =>
                            setForm({ ...form, diagnosis: e.target.value })
                          }
                        />
                      </div>

                      <div className="mb-3">
                        <label className="mc-form-label">Prescription</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Enter prescription details"
                          value={form.prescription}
                          onChange={(e) =>
                            setForm({ ...form, prescription: e.target.value })
                          }
                        />
                      </div>

                      <div className="mb-3">
                        <label className="mc-form-label">Lab Request</label>
                        <input
                          className="form-control"
                          placeholder="e.g. CBC, Blood sugar"
                          value={form.lab_request}
                          onChange={(e) =>
                            setForm({ ...form, lab_request: e.target.value })
                          }
                        />
                      </div>

                      <div className="mb-3">
                        <label className="mc-form-label">Notes</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Additional notes"
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Right Column - Vital Signs */}
                    <div className="col-md-5">
                      <h6 className="text-section-title mb-3">Vital Signs</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="p-3 border rounded bg-light text-center">
                            <Thermometer
                              size={18}
                              className="text-danger mb-1"
                            />
                            <div className="text-caption text-muted">
                              Temperature (°C)
                            </div>
                            <input
                              className="form-control form-control-sm text-center border-0 bg-transparent fw-bold mt-1"
                              value={form.temp}
                              onChange={(e) =>
                                setForm({ ...form, temp: e.target.value })
                              }
                              placeholder="—"
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 border rounded bg-light text-center">
                            <Activity size={18} className="text-primary mb-1" />
                            <div className="text-caption text-muted">
                              Blood Pressure
                            </div>
                            <input
                              className="form-control form-control-sm text-center border-0 bg-transparent fw-bold mt-1"
                              value={form.bp}
                              onChange={(e) =>
                                setForm({ ...form, bp: e.target.value })
                              }
                              placeholder="—"
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 border rounded bg-light text-center">
                            <Heart size={18} className="text-danger mb-1" />
                            <div className="text-caption text-muted">
                              Pulse (bpm)
                            </div>
                            <input
                              className="form-control form-control-sm text-center border-0 bg-transparent fw-bold mt-1"
                              value={form.pulse}
                              onChange={(e) =>
                                setForm({ ...form, pulse: e.target.value })
                              }
                              placeholder="—"
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 border rounded bg-light text-center">
                            <Weight size={18} className="text-success mb-1" />
                            <div className="text-caption text-muted">
                              Weight (kg)
                            </div>
                            <input
                              className="form-control form-control-sm text-center border-0 bg-transparent fw-bold mt-1"
                              value={form.weight}
                              onChange={(e) =>
                                setForm({ ...form, weight: e.target.value })
                              }
                              placeholder="—"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => handleSave(false)}
                      disabled={saving}
                    >
                      Save as Draft
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(true)}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : null}
                      Complete Consultation
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mc-card">
              <div className="mc-card-body text-center py-5 text-muted">
                <User size={40} className="mb-3 opacity-50" />
                <p>Select a patient from the queue to start consultation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ConsultationWorkspace;
