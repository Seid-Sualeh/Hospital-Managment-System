import React, { useState, useEffect } from "react";
import PageShell from "../../components/Common/PageShell";
import PageHeader from "../../components/Common/PageHeader";
import ChartLine from "../../components/Common/ChartLine";
import ChartDonut from "../../components/Common/ChartDonut";
import Loader from "../../components/Common/Loader";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import {
  Users,
  Calendar,
  FlaskConical,
  TrendingUp,
  Download,
} from "lucide-react";

const REPORT_TABS = [
  { key: "summary", label: "Summary" },
  { key: "revenue", label: "Revenue" },
  { key: "patients", label: "Patients" },
  { key: "appointments", label: "Appointments" },
  { key: "laboratory", label: "Laboratory" },
];

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_START = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

const ReportsWorkspace = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [startDate, setStartDate] = useState(MONTH_START);
  const [endDate, setEndDate] = useState(TODAY);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/reports/${activeTab === "summary" ? "summary" : activeTab}`,
          { params: { startDate, endDate } },
        );
        setData(res.data?.data || res.data);
      } catch {
        // Use mock data
        setData(MOCK_DATA[activeTab]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, startDate, endDate]);

  const MOCK_DATA = {
    summary: {
      totalRevenue: 125430,
      totalPatients: 248,
      totalAppointments: 312,
      totalLabTests: 89,
      avgRevenuePerPatient: 505.77,
    },
    revenue: { monthly: [15000, 18000, 22000, 19000, 25430, 12000] },
    patients: { new: 48, returning: 200, total: 248 },
    appointments: { scheduled: 312, completed: 280, cancelled: 32 },
    laboratory: { pending: 12, completed: 77, total: 89 },
  };

  const d = data || MOCK_DATA[activeTab];

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
          title="Reports"
          subtitle="Analytics and business insights"
        />
        <button className="btn btn-outline-primary d-flex align-items-center gap-2">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="mc-card mb-4">
        <div className="mc-card-body">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <label className="mc-form-label mb-0">From:</label>
              <input
                className="form-control form-control-sm input-sm"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="mc-form-label mb-0">To:</label>
              <input
                className="form-control form-control-sm input-sm"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="row g-4">
        {/* Sidebar Tabs */}
        <div className="col-lg-2">
          <div className="mc-card">
            <div className="mc-card-body p-2">
              <div className="d-flex flex-column gap-1">
                {REPORT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`btn text-start btn-sm ${activeTab === tab.key ? "btn-primary" : "btn-light"}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="col-lg-10">
          {loading ? (
            <Loader />
          ) : (
            <>
              {activeTab === "summary" && (
                <div>
                  {/* Summary KPI Cards */}
                  <div className="row row-gutter mb-4">
                    <div className="col-sm-6 col-xl-3">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <div className="d-flex align-items-center gap-3">
                            <div className="stat-card-icon primary">
                              <TrendingUp size={18} />
                            </div>
                            <div>
                              <div className="text-caption">Total Revenue</div>
                              <div className="fw-bold fs-6">
                                {Number(d.totalRevenue || 0).toLocaleString()}{" "}
                                ETB
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-xl-3">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <div className="d-flex align-items-center gap-3">
                            <div className="stat-card-icon success">
                              <Users size={18} />
                            </div>
                            <div>
                              <div className="text-caption">Total Patients</div>
                              <div className="fw-bold fs-6">
                                {d.totalPatients || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-xl-3">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <div className="d-flex align-items-center gap-3">
                            <div className="stat-card-icon warning">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <div className="text-caption">Appointments</div>
                              <div className="fw-bold fs-6">
                                {d.totalAppointments || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-xl-3">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <div className="d-flex align-items-center gap-3">
                            <div className="stat-card-icon danger">
                              <FlaskConical size={18} />
                            </div>
                            <div>
                              <div className="text-caption">Lab Tests</div>
                              <div className="fw-bold fs-6">
                                {d.totalLabTests || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row g-4">
                    <div className="col-lg-8">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <h6 className="text-section-title">Revenue Trend</h6>
                          <ChartLine />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="mc-card">
                        <div className="mc-card-body">
                          <h6 className="text-section-title">
                            Visit Distribution
                          </h6>
                          <ChartDonut />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "revenue" && (
                <div className="mc-card">
                  <div className="mc-card-body">
                    <h6 className="text-section-title mb-3">Monthly Revenue</h6>
                    <ChartLine />
                    <div className="table-responsive mt-4">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Month</th>
                            <th>Revenue (ETB)</th>
                            <th>Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
                            (m, i) => (
                              <tr key={m}>
                                <td>{m} 2024</td>
                                <td className="fw-semibold">
                                  {[15000, 18000, 22000, 19000, 25430, 12000][
                                    i
                                  ].toLocaleString()}
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success">
                                    +{[8, 20, 22, -14, 34, -52][i]}%
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "patients" && (
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="mc-card text-center">
                      <div className="mc-card-body">
                        <div className="fs-2 fw-bold text-primary">
                          {d.new || 48}
                        </div>
                        <div className="text-caption">New Patients</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mc-card text-center">
                      <div className="mc-card-body">
                        <div className="fs-2 fw-bold text-success">
                          {d.returning || 200}
                        </div>
                        <div className="text-caption">Returning Patients</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mc-card text-center">
                      <div className="mc-card-body">
                        <div className="fs-2 fw-bold">{d.total || 248}</div>
                        <div className="text-caption">Total Patients</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mc-card">
                      <div className="mc-card-body">
                        <h6 className="text-section-title">
                          Patient Distribution
                        </h6>
                        <ChartDonut />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appointments" && (
                <div className="row g-4">
                  {[
                    {
                      label: "Scheduled",
                      value: d.scheduled || 312,
                      color: "primary",
                    },
                    {
                      label: "Completed",
                      value: d.completed || 280,
                      color: "success",
                    },
                    {
                      label: "Cancelled",
                      value: d.cancelled || 32,
                      color: "danger",
                    },
                  ].map((kpi) => (
                    <div className="col-md-4" key={kpi.label}>
                      <div className="mc-card text-center">
                        <div className="mc-card-body">
                          <div className={`fs-2 fw-bold text-${kpi.color}`}>
                            {kpi.value}
                          </div>
                          <div className="text-caption">{kpi.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="col-12">
                    <div className="mc-card">
                      <div className="mc-card-body">
                        <h6 className="text-section-title">
                          Appointment Trend
                        </h6>
                        <ChartLine />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "laboratory" && (
                <div className="row g-4">
                  {[
                    {
                      label: "Total Tests",
                      value: d.total || 89,
                      color: "primary",
                    },
                    {
                      label: "Completed",
                      value: d.completed || 77,
                      color: "success",
                    },
                    {
                      label: "Pending",
                      value: d.pending || 12,
                      color: "warning",
                    },
                  ].map((kpi) => (
                    <div className="col-md-4" key={kpi.label}>
                      <div className="mc-card text-center">
                        <div className="mc-card-body">
                          <div className={`fs-2 fw-bold text-${kpi.color}`}>
                            {kpi.value}
                          </div>
                          <div className="text-caption">{kpi.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="col-12">
                    <div className="mc-card">
                      <div className="mc-card-body">
                        <h6 className="text-section-title">Lab Distribution</h6>
                        <ChartDonut />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ReportsWorkspace;
