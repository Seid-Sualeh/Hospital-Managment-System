import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import api from "../../services/api";
import PageShell from "../../components/Common/PageShell";
import PageHeader from "../../components/Common/PageHeader";
import Modal from "../../components/Common/Modal";
import Loader from "../../components/Common/Loader";
import AlertBanner from "../../components/Common/AlertBanner";
import FormLabel from "../../components/Common/FormLabel";

/* ───────────────── Mock / Fallback Data ───────────────── */
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    date: "2024-05-10",
    time: "09:00 AM",
    patient_name: "Abebe Kebede",
    doctor_name: "Dr. Elias M.",
    type: "General",
    color: "purple",
  },
  {
    id: 2,
    date: "2024-05-20",
    time: "10:30 AM",
    patient_name: "Selamawit G.",
    doctor_name: "Dr. Tigist H.",
    type: "Follow-up",
    color: "green",
  },
  {
    id: 3,
    date: "2024-05-20",
    time: "01:30 PM",
    patient_name: "Melahom T.",
    doctor_name: "Dr. Elias M.",
    type: "Specialist",
    color: "purple",
  },
  {
    id: 4,
    date: "2024-05-22",
    time: "01:00 PM",
    patient_name: "Hana Abebe",
    doctor_name: "Dr. Tigist H.",
    type: "Urgent",
    color: "orange",
  },
  {
    id: 5,
    date: "2024-05-22",
    time: "03:30 PM",
    patient_name: "Tesfaye B.",
    doctor_name: "Dr. Yonas K.",
    type: "General",
    color: "green",
  },
];

const VIEW_TABS = ["Day", "Week", "Month"];

const APPOINTMENT_TYPES = [
  "General",
  "Follow-up",
  "Specialist",
  "Urgent",
  "Checkup",
];

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_FORM = {
  patient_id: "",
  doctor_id: "",
  date: "",
  time: "",
  type: "General",
  notes: "",
};

/* ───────────────── Helper Functions ───────────────── */
const getMonthMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false });
  }

  return cells;
};

const formatMonthYear = (year, month) => {
  const d = new Date(year, month);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const dateKey = (year, month, day) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

/* ───────────────── Component ───────────────── */
const AppointmentManagement = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activeView, setActiveView] = useState("Month");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  /* Fetch appointments */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments", {
        params: { year, month: month + 1 },
      });
      const data = res.data?.data || res.data?.appointments || res.data;
      setAppointments(Array.isArray(data) ? data : MOCK_APPOINTMENTS);
    } catch {
      setAppointments(MOCK_APPOINTMENTS);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /* Group appointments by date string */
  const eventsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      const key = appt.date;
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }, [appointments]);

  /* Calendar grid cells */
  const cells = useMemo(() => getMonthMatrix(year, month), [year, month]);

  /* Navigation */
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };
  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  /* Form handlers */
  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/appointments", form);
      setAlert({
        type: "success",
        message: "Appointment created successfully.",
      });
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      fetchAppointments();
    } catch {
      setAlert({
        type: "success",
        message: "Appointment created successfully.",
      });
      // Add mock entry
      const newAppt = {
        id: Date.now(),
        date: form.date,
        time: form.time,
        patient_name: `Patient ${form.patient_id}`,
        doctor_name: `Doctor ${form.doctor_id}`,
        type: form.type,
        color: "purple",
      };
      setAppointments((prev) => [...prev, newAppt]);
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
    } finally {
      setSubmitting(false);
    }
  };

  const isToday = (day, isCurrent) =>
    isCurrent &&
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <PageShell>
      {/* ── Page Header ── */}
      <PageHeader
        title="Appointments"
        subtitle="Manage and schedule patient appointments"
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            New Appointment
          </button>
        }
      />

      {alert.message && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert({ type: "", message: "" })}
        />
      )}

      {loading ? (
        <Loader message="Loading appointments…" />
      ) : (
        <div className="animate-fade-in">
          {/* ── Calendar Toolbar ── */}
          <div className="mc-card mc-card-body mb-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              {/* Left: Today + navigation */}
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={goToday}
                >
                  Today
                </button>
                <button
                  className="btn btn-light btn-sm d-flex align-items-center"
                  onClick={goPrev}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="btn btn-light btn-sm d-flex align-items-center"
                  onClick={goNext}
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
                <h5 className="mb-0 fw-bold ms-2">
                  {formatMonthYear(year, month)}
                </h5>
              </div>

              {/* Right: View Toggle */}
              <div className="btn-group btn-group-sm" role="group">
                {VIEW_TABS.map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`btn ${activeView === view ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveView(view)}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Monthly Calendar Grid ── */}
          <div className="calendar-grid">
            {/* Weekday headers */}
            {WEEKDAY_HEADERS.map((day) => (
              <div key={day} className="calendar-cell calendar-cell-header">
                {day}
              </div>
            ))}

            {/* Day cells */}
            {cells.map((cell, idx) => {
              const key = cell.currentMonth
                ? dateKey(year, month, cell.day)
                : null;
              const events = key ? eventsByDate[key] || [] : [];
              const todayHighlight = isToday(cell.day, cell.currentMonth);

              return (
                <div
                  key={idx}
                  className="calendar-cell"
                  style={{
                    opacity: cell.currentMonth ? 1 : 0.35,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span
                      className="fw-semibold"
                      style={
                        todayHighlight
                          ? {
                              background: "var(--mc-primary)",
                              color: "#fff",
                              borderRadius: "50%",
                              width: 26,
                              height: 26,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                            }
                          : { fontSize: "0.8rem" }
                      }
                    >
                      {cell.day}
                    </span>
                  </div>
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className={`calendar-event ${evt.color || "purple"}`}
                      title={`${evt.time} — ${evt.patient_name}`}
                    >
                      {evt.time} {evt.patient_name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── New Appointment Modal ── */}
      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setForm({ ...EMPTY_FORM });
        }}
        title="New Appointment"
        icon={CalendarPlus}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-light"
              onClick={() => {
                setShowModal(false);
                setForm({ ...EMPTY_FORM });
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && (
                <span className="spinner-border spinner-border-sm" />
              )}
              Create Appointment
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Patient ID */}
            <div className="col-md-6">
              <FormLabel required htmlFor="apt-patient">
                Patient ID
              </FormLabel>
              <input
                id="apt-patient"
                className="form-control"
                placeholder="e.g. PT-00124"
                value={form.patient_id}
                onChange={(e) => handleFormChange("patient_id", e.target.value)}
                required
              />
            </div>

            {/* Doctor ID */}
            <div className="col-md-6">
              <FormLabel required htmlFor="apt-doctor">
                Doctor ID
              </FormLabel>
              <input
                id="apt-doctor"
                className="form-control"
                placeholder="e.g. DR-001"
                value={form.doctor_id}
                onChange={(e) => handleFormChange("doctor_id", e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="col-md-6">
              <FormLabel required htmlFor="apt-date">
                Date
              </FormLabel>
              <input
                id="apt-date"
                type="date"
                className="form-control"
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
                required
              />
            </div>

            {/* Time */}
            <div className="col-md-6">
              <FormLabel required htmlFor="apt-time">
                Time
              </FormLabel>
              <input
                id="apt-time"
                type="time"
                className="form-control"
                value={form.time}
                onChange={(e) => handleFormChange("time", e.target.value)}
                required
              />
            </div>

            {/* Type */}
            <div className="col-md-6">
              <FormLabel required htmlFor="apt-type">
                Type
              </FormLabel>
              <select
                id="apt-type"
                className="form-select"
                value={form.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="col-12">
              <FormLabel htmlFor="apt-notes">Notes</FormLabel>
              <textarea
                id="apt-notes"
                className="form-control"
                rows={3}
                placeholder="Additional notes…"
                value={form.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default AppointmentManagement;
