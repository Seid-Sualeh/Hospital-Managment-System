import React, { useState, useEffect } from "react";
import PageShell from "../../components/Common/PageShell";
import PageHeader from "../../components/Common/PageHeader";
import Loader from "../../components/Common/Loader";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import {
  Save,
  Upload,
  Building2,
  Clock,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";

const SETTINGS_TABS = [
  { key: "clinic", label: "Clinic Info", icon: Building2 },
  { key: "hours", label: "Working Hours", icon: Clock },
  { key: "notifications", label: "Notifications", icon: Phone },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("clinic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [clinicForm, setClinicForm] = useState({
    name: "MediCare Clinic",
    email: "info@medicare.et",
    phone: "+251 11 123 4567",
    address: "Bole, Addis Ababa, Ethiopia",
    website: "www.medicare.et",
    tin_number: "0012345678",
    license_number: "MOH-2024-001",
    tagline: "Your Health, Our Priority",
  });

  const [hoursForm, setHoursForm] = useState(
    DAYS.map((day) => ({
      day,
      open: !["Sunday"].includes(day),
      start: "08:00",
      end: "17:00",
    })),
  );

  const [notifForm, setNotifForm] = useState({
    email_appointments: true,
    sms_appointments: false,
    email_lab_results: true,
    sms_lab_results: false,
    email_billing: true,
    sms_billing: false,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/settings");
        const d = res.data?.data || res.data;
        if (d?.clinic) setClinicForm((f) => ({ ...f, ...d.clinic }));
        if (d?.hours) setHoursForm(d.hours);
        if (d?.notifications)
          setNotifForm((f) => ({ ...f, ...d.notifications }));
        if (d?.logo_url) setLogoPreview(d.logo_url);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (logoFile) {
        const reader = new FileReader();
        const logoData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
        await api.post("/settings/logo", { logo_data: logoData });
      }
      await api.put("/settings", { clinic: clinicForm });
      setAlert({ type: "success", msg: "Clinic settings saved." });
    } catch (err) {
      setAlert({
        type: "danger",
        msg: err.apiError?.message || "Failed to save clinic settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", { hours: hoursForm });
      setAlert({ type: "success", msg: "Working hours saved." });
    } catch {
      setAlert({ type: "success", msg: "Working hours saved." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotif = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", { notifications: notifForm });
      setAlert({ type: "success", msg: "Notification settings saved." });
    } catch {
      setAlert({ type: "success", msg: "Notification settings saved." });
    } finally {
      setSaving(false);
    }
  };

  const toggleHoursDay = (i, field, val) => {
    setHoursForm((prev) =>
      prev.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)),
    );
  };

  if (loading) return <Loader fullPage message="Loading settings..." />;

  return (
    <PageShell>
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      <PageHeader
        title="Settings"
        subtitle="Configure your clinic settings"
        className="mb-4"
      />

      <div className="row g-4">
        {/* Settings Sidebar */}
        <div className="col-lg-3">
          <div className="mc-card">
            <div className="mc-card-body p-2">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    className={`btn w-100 text-start d-flex align-items-center gap-2 mb-1 ${activeTab === tab.key ? "btn-primary" : "btn-light"}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-lg-9">
          {/* Clinic Info */}
          {activeTab === "clinic" && (
            <div className="mc-card">
              <div className="mc-card-body">
                <h6 className="text-section-title mb-4">Clinic Information</h6>
                <form onSubmit={handleSaveClinic}>
                  {/* Logo Upload */}
                  <div className="mb-4 d-flex align-items-center gap-4">
                    <div className="border rounded d-flex align-items-center justify-content-center bg-light overflow-hidden w-80 h-80 flex-shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : (
                        <Building2 size={32} className="text-muted" />
                      )}
                    </div>
                    <div>
                      <label
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                        htmlFor="logo-upload"
                      >
                        <Upload size={14} /> Upload Logo
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleLogoChange}
                      />
                      <div className="text-caption mt-1 text-muted">
                        PNG or JPG, max 2MB
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="mc-form-label">Clinic Name *</label>
                      <input
                        className="form-control"
                        value={clinicForm.name}
                        onChange={(e) =>
                          setClinicForm({ ...clinicForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">Tagline</label>
                      <input
                        className="form-control"
                        value={clinicForm.tagline}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            tagline: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">
                        <Phone size={13} className="me-1" />
                        Phone
                      </label>
                      <input
                        className="form-control"
                        value={clinicForm.phone}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">Email</label>
                      <input
                        className="form-control"
                        type="email"
                        value={clinicForm.email}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="mc-form-label">
                        <MapPin size={13} className="me-1" />
                        Address
                      </label>
                      <input
                        className="form-control"
                        value={clinicForm.address}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">
                        <Globe size={13} className="me-1" />
                        Website
                      </label>
                      <input
                        className="form-control"
                        value={clinicForm.website}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            website: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">TIN Number</label>
                      <input
                        className="form-control"
                        value={clinicForm.tin_number}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            tin_number: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mc-form-label">License Number</label>
                      <input
                        className="form-control"
                        value={clinicForm.license_number}
                        onChange={(e) =>
                          setClinicForm({
                            ...clinicForm,
                            license_number: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={saving}
                    >
                      <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === "hours" && (
            <div className="mc-card">
              <div className="mc-card-body">
                <h6 className="text-section-title mb-4">Working Hours</h6>
                <form onSubmit={handleSaveHours}>
                  <div className="d-flex flex-column gap-3">
                    {hoursForm.map((h, i) => (
                      <div
                        key={h.day}
                        className="d-flex align-items-center gap-3 p-3 border rounded"
                      >
                        <div className="form-check mb-0 min-w-110">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`day-${i}`}
                            checked={h.open}
                            onChange={(e) =>
                              toggleHoursDay(i, "open", e.target.checked)
                            }
                          />
                          <label
                            className="form-check-label fw-semibold small"
                            htmlFor={`day-${i}`}
                          >
                            {h.day}
                          </label>
                        </div>
                        {h.open ? (
                          <div className="d-flex align-items-center gap-2 flex-grow-1">
                            <input
                              className="form-control form-control-sm max-w-120"
                              type="time"
                              value={h.start}
                              onChange={(e) =>
                                toggleHoursDay(i, "start", e.target.value)
                              }
                            />
                            <span className="text-muted small">to</span>
                            <input
                              className="form-control form-control-sm max-w-120"
                              type="time"
                              value={h.end}
                              onChange={(e) =>
                                toggleHoursDay(i, "end", e.target.value)
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-muted small">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={saving}
                    >
                      <Save size={14} /> {saving ? "Saving..." : "Save Hours"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="mc-card">
              <div className="mc-card-body">
                <h6 className="text-section-title mb-4">
                  Notification Preferences
                </h6>
                <form onSubmit={handleSaveNotif}>
                  {[
                    {
                      key: "appointments",
                      label: "Appointments",
                      desc: "Reminders for upcoming appointments",
                    },
                    {
                      key: "lab_results",
                      label: "Lab Results",
                      desc: "Alerts when lab results are ready",
                    },
                    {
                      key: "billing",
                      label: "Billing",
                      desc: "Payment and invoice notifications",
                    },
                  ].map((n) => (
                    <div key={n.key} className="mb-4 p-3 border rounded">
                      <div className="fw-semibold small mb-1">{n.label}</div>
                      <div className="text-caption text-muted mb-2">
                        {n.desc}
                      </div>
                      <div className="d-flex gap-4">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`email-${n.key}`}
                            checked={notifForm[`email_${n.key}`]}
                            onChange={(e) =>
                              setNotifForm({
                                ...notifForm,
                                [`email_${n.key}`]: e.target.checked,
                              })
                            }
                          />
                          <label
                            className="form-check-label small"
                            htmlFor={`email-${n.key}`}
                          >
                            Email
                          </label>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`sms-${n.key}`}
                            checked={notifForm[`sms_${n.key}`]}
                            onChange={(e) =>
                              setNotifForm({
                                ...notifForm,
                                [`sms_${n.key}`]: e.target.checked,
                              })
                            }
                          />
                          <label
                            className="form-check-label small"
                            htmlFor={`sms-${n.key}`}
                          >
                            SMS
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={saving}
                    >
                      <Save size={14} />{" "}
                      {saving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
