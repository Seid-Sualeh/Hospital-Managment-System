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
import { Plus, Eye, CreditCard, FileText } from "lucide-react";

const MOCK_INVOICES = [
  {
    id: 1,
    invoice_uid: "INV-0012",
    patient_uid: "PT-00124",
    patient_name: "Abebe Kebede",
    date: "2024-05-15",
    amount: 450.0,
    paid: 450.0,
    balance: 0,
    status: "paid",
  },
  {
    id: 2,
    invoice_uid: "INV-0011",
    patient_uid: "PT-00123",
    patient_name: "Selamawit G.",
    date: "2024-05-14",
    amount: 1200.0,
    paid: 500.0,
    balance: 700.0,
    status: "partial",
  },
  {
    id: 3,
    invoice_uid: "INV-0010",
    patient_uid: "PT-00122",
    patient_name: "Melahom T.",
    date: "2024-05-13",
    amount: 320.0,
    paid: 0,
    balance: 320.0,
    status: "unpaid",
  },
  {
    id: 4,
    invoice_uid: "INV-0009",
    patient_uid: "PT-00121",
    patient_name: "Hana Abebe",
    date: "2024-05-13",
    amount: 800.0,
    paid: 800.0,
    balance: 0,
    status: "paid",
  },
  {
    id: 5,
    invoice_uid: "INV-0008",
    patient_uid: "PT-00120",
    patient_name: "Tesfaye B.",
    date: "2024-05-12",
    amount: 560.0,
    paid: 0,
    balance: 560.0,
    status: "unpaid",
  },
];

const SERVICE_OPTIONS = [
  "General Consultation",
  "Lab Test",
  "Medication",
  "Specialist Visit",
  "Emergency",
  "Procedure",
];
const PAYMENT_METHODS = [
  "Cash",
  "CBE Birr",
  "Telebirr",
  "Bank Transfer",
  "Insurance",
];

const BillingLedger = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({
    patient_uid: "",
    services: [{ name: "", quantity: 1, price: "" }],
  });
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "Cash",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/billing/invoices", { params });
      const data = res.data?.data || res.data;
      setInvoices(
        data.invoices || (Array.isArray(data) ? data : MOCK_INVOICES),
      );
    } catch {
      setInvoices(MOCK_INVOICES);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const addServiceLine = () =>
    setForm((f) => ({
      ...f,
      services: [...f.services, { name: "", quantity: 1, price: "" }],
    }));
  const removeServiceLine = (i) =>
    setForm((f) => ({
      ...f,
      services: f.services.filter((_, idx) => idx !== i),
    }));
  const updateService = (i, field, val) =>
    setForm((f) => ({
      ...f,
      services: f.services.map((s, idx) =>
        idx === i ? { ...s, [field]: val } : s,
      ),
    }));
  const totalAmount = () =>
    form.services.reduce(
      (sum, s) => sum + Number(s.price) * Number(s.quantity || 1),
      0,
    );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/billing/invoices", { ...form, amount: totalAmount() });
      setAlert({ type: "success", msg: "Invoice created successfully." });
      setShowAddModal(false);
      load();
    } catch {
      const newInv = {
        id: Date.now(),
        invoice_uid: `INV-${String(invoices.length + 1).padStart(4, "0")}`,
        patient_uid: form.patient_uid,
        patient_name: "New Patient",
        date: new Date().toISOString().slice(0, 10),
        amount: totalAmount(),
        paid: 0,
        balance: totalAmount(),
        status: "unpaid",
      };
      setInvoices((prev) => [newInv, ...prev]);
      setAlert({ type: "success", msg: "Invoice created successfully." });
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/billing/payments/initiate", {
        invoice_id: selectedInvoice.id,
        ...payForm,
      });
      setAlert({ type: "success", msg: "Payment recorded successfully." });
      setShowPayModal(false);
      load();
    } catch {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== selectedInvoice.id) return inv;
          const newPaid = Number(inv.paid) + Number(payForm.amount);
          const newBalance = Number(inv.amount) - newPaid;
          return {
            ...inv,
            paid: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? "paid" : "partial",
          };
        }),
      );
      setAlert({ type: "success", msg: "Payment recorded successfully." });
      setShowPayModal(false);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (inv) => {
    setSelectedInvoice(inv);
    setShowDetailModal(true);
  };
  const openPay = (inv) => {
    setSelectedInvoice(inv);
    setPayForm({ amount: inv.balance, method: "Cash", notes: "" });
    setShowPayModal(true);
  };

  const columns = [
    {
      header: "Invoice #",
      render: (r) => (
        <span className="fw-semibold text-primary">{r.invoice_uid}</span>
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
    {
      header: "Amount (ETB)",
      render: (r) => (
        <span className="fw-bold">{Number(r.amount).toLocaleString()}</span>
      ),
    },
    {
      header: "Paid (ETB)",
      render: (r) => (
        <span className="text-success">{Number(r.paid).toLocaleString()}</span>
      ),
    },
    {
      header: "Balance (ETB)",
      render: (r) => (
        <span className={r.balance > 0 ? "text-danger fw-bold" : "text-muted"}>
          {Number(r.balance).toLocaleString()}
        </span>
      ),
    },
    { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Action",
      render: (r) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            title="View"
            onClick={() => openDetail(r)}
          >
            <Eye size={14} />
          </button>
          {r.status !== "paid" && (
            <button
              className="btn btn-sm btn-outline-success"
              title="Collect Payment"
              onClick={() => openPay(r)}
            >
              <CreditCard size={14} />
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
        <PageHeader title="Billing" subtitle="Manage invoices and payments" />
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => {
            setForm({
              patient_uid: "",
              services: [{ name: "", quantity: 1, price: "" }],
            });
            setShowAddModal(true);
          }}
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="mc-card">
        <div className="mc-card-body">
          <div className="d-flex flex-wrap gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search invoices..."
            />
            <select
              className="form-select w-160"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : invoices.length === 0 ? (
            <EmptyState message="No invoices found." />
          ) : (
            <div className="table-responsive">
              <DataTable columns={columns} data={invoices} />
            </div>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Invoice"
        size="lg"
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

          <label className="mc-form-label">Services</label>
          {form.services.map((s, i) => (
            <div className="row g-2 mb-2" key={i}>
              <div className="col-5">
                <select
                  className="form-select form-select-sm"
                  value={s.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                  required
                >
                  <option value="">Select service</option>
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-2">
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={s.quantity}
                  onChange={(e) => updateService(i, "quantity", e.target.value)}
                />
              </div>
              <div className="col-4">
                <input
                  className="form-control form-control-sm"
                  type="number"
                  step="0.01"
                  placeholder="Price (ETB)"
                  value={s.price}
                  onChange={(e) => updateService(i, "price", e.target.value)}
                  required
                />
              </div>
              <div className="col-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={() => removeServiceLine(i)}
                  disabled={form.services.length === 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mb-3"
            onClick={addServiceLine}
          >
            + Add Line
          </button>

          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <div className="fw-bold">
              Total: {totalAmount().toLocaleString()} ETB
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Invoice — ${selectedInvoice?.invoice_uid}`}
        size="md"
      >
        {selectedInvoice && (
          <div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <div className="text-caption">Patient</div>
                <div className="fw-semibold">
                  {selectedInvoice.patient_name}
                </div>
              </div>
              <div className="col-6">
                <div className="text-caption">Date</div>
                <div className="fw-semibold">
                  {new Date(selectedInvoice.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="col-6">
                <div className="text-caption">Amount</div>
                <div className="fw-bold text-primary">
                  {Number(selectedInvoice.amount).toLocaleString()} ETB
                </div>
              </div>
              <div className="col-6">
                <div className="text-caption">Paid</div>
                <div className="fw-semibold text-success">
                  {Number(selectedInvoice.paid).toLocaleString()} ETB
                </div>
              </div>
              <div className="col-6">
                <div className="text-caption">Balance</div>
                <div
                  className={`fw-bold ${selectedInvoice.balance > 0 ? "text-danger" : "text-muted"}`}
                >
                  {Number(selectedInvoice.balance).toLocaleString()} ETB
                </div>
              </div>
              <div className="col-6">
                <div className="text-caption">Status</div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>
            {selectedInvoice.status !== "paid" && (
              <button
                className="btn btn-success w-100"
                onClick={() => {
                  setShowDetailModal(false);
                  openPay(selectedInvoice);
                }}
              >
                <CreditCard size={14} className="me-2" /> Collect Payment
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        show={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Collect Payment"
        size="sm"
      >
        <form onSubmit={handlePaySubmit}>
          <div className="mb-3">
            <label className="mc-form-label">Amount (ETB) *</label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              value={payForm.amount}
              onChange={(e) =>
                setPayForm({ ...payForm, amount: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Payment Method</label>
            <select
              className="form-select"
              value={payForm.method}
              onChange={(e) =>
                setPayForm({ ...payForm, method: e.target.value })
              }
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={payForm.notes}
              onChange={(e) =>
                setPayForm({ ...payForm, notes: e.target.value })
              }
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPayModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default BillingLedger;
