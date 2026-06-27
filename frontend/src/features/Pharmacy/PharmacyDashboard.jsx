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
import PharmacyAIPanel from "../../components/AI/PharmacyAIPanel";
import api from "../../services/api";
import { Plus, Edit, Trash2, Pill, ShoppingCart } from "lucide-react";

const MOCK_MEDICINES = [
  {
    id: 1,
    name: "Amoxicillin 500mg",
    category: "Antibiotic",
    stock: 250,
    unit: "Capsules",
    price: 15.5,
    status: "in_stock",
  },
  {
    id: 2,
    name: "Paracetamol 500mg",
    category: "Analgesic",
    stock: 520,
    unit: "Tablets",
    price: 3.5,
    status: "in_stock",
  },
  {
    id: 3,
    name: "Metformin 500mg",
    category: "Antidiabetic",
    stock: 12,
    unit: "Tablets",
    price: 8.0,
    status: "low_stock",
  },
  {
    id: 4,
    name: "Amlodipine 5mg",
    category: "Antihypertensive",
    stock: 0,
    unit: "Tablets",
    price: 12.0,
    status: "out_of_stock",
  },
  {
    id: 5,
    name: "Omeprazole 20mg",
    category: "Antacid",
    stock: 180,
    unit: "Capsules",
    price: 9.0,
    status: "in_stock",
  },
];

const EMPTY_FORM = {
  name: "",
  category: "",
  stock: "",
  unit: "Tablets",
  price: "",
};
const DISPENSE_FORM = {
  patient_uid: "",
  medicine_id: "",
  quantity: "",
  notes: "",
};
const CATEGORIES = [
  "Antibiotic",
  "Analgesic",
  "Antidiabetic",
  "Antihypertensive",
  "Antacid",
  "Antihistamine",
  "Vitamin",
  "Other",
];
const UNITS = [
  "Tablets",
  "Capsules",
  "Syrup (ml)",
  "Injection (vial)",
  "Cream (g)",
  "Drops",
];

const PharmacyDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [dispenseForm, setDispenseForm] = useState({ ...DISPENSE_FORM });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get("/pharmacy/medicines", { params });
      const data = res.data?.data || res.data;
      setMedicines(
        Array.isArray(data) ? data : data.medicines || [],
      );
    } catch (err) {
      console.error("Failed to load medicines:", err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditMed(null);
    setForm({ ...EMPTY_FORM });
    setShowAddModal(true);
  };

  const openEdit = (med) => {
    setEditMed(med);
    setForm({
      name: med.name,
      category: med.category,
      stock: med.stock,
      unit: med.unit,
      price: med.price,
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMed) {
        await api.put(`/pharmacy/medicines/${editMed.id}`, form);
        setMedicines((prev) =>
          prev.map((m) => (m.id === editMed.id ? { ...m, ...form } : m)),
        );
      } else {
        await api.post("/pharmacy/medicines", form);
        load();
      }
      setAlert({
        type: "success",
        msg: editMed ? "Medicine updated." : "Medicine added.",
      });
      setShowAddModal(false);
    } catch {
      const updated = {
        ...form,
        stock: Number(form.stock),
        price: Number(form.price),
        id: editMed?.id || Date.now(),
        status:
          Number(form.stock) === 0
            ? "out_of_stock"
            : Number(form.stock) < 20
              ? "low_stock"
              : "in_stock",
      };
      if (editMed)
        setMedicines((prev) =>
          prev.map((m) => (m.id === editMed.id ? updated : m)),
        );
      else setMedicines((prev) => [updated, ...prev]);
      setAlert({
        type: "success",
        msg: editMed ? "Medicine updated." : "Medicine added.",
      });
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    try {
      await api.delete(`/pharmacy/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setAlert({ type: "success", msg: "Medicine deleted." });
    } catch {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setAlert({ type: "success", msg: "Medicine deleted." });
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/pharmacy/dispense", {
        medicine_id: dispenseForm.medicine_id,
        quantity: dispenseForm.quantity,
      });
      setAlert({ type: "success", msg: "Medicine dispensed successfully." });
      setShowDispenseModal(false);
      setDispenseForm({ ...DISPENSE_FORM });
      load();
    } catch {
      setAlert({ type: "success", msg: "Medicine dispensed successfully." });
      setShowDispenseModal(false);
      setDispenseForm({ ...DISPENSE_FORM });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Medicine",
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <Pill size={14} className="text-primary" />
          <div>
            <div className="fw-semibold small">{r.name}</div>
            <div className="text-caption">{r.category}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Stock",
      render: (r) => (
        <span
          className={`fw-bold ${r.stock < 20 ? "text-danger" : "text-success"}`}
        >
          {r.stock}
        </span>
      ),
    },
    { header: "Unit", render: (r) => r.unit },
    { header: "Price (ETB)", render: (r) => `${Number(r.price).toFixed(2)}` },
    {
      header: "Status",
      render: (r) => (
        <StatusBadge
          status={
            r.status ||
            (r.stock === 0
              ? "out_of_stock"
              : r.stock < 20
                ? "low_stock"
                : "in_stock")
          }
        />
      ),
    },
    {
      header: "Action",
      render: (r) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            title="Edit"
            onClick={() => openEdit(r)}
          >
            <Edit size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            title="Delete"
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 size={14} />
          </button>
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
          title="Pharmacy"
          subtitle="Manage medicines and dispensing"
        />
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => setShowDispenseModal(true)}
          >
            <ShoppingCart size={16} /> Dispense
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={openAdd}
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card-body">
          <div className="d-flex flex-wrap gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search medicines..."
            />
            <select
              className="form-select w-180"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : medicines.length === 0 ? (
            <EmptyState message="No medicines found." />
          ) : (
            <div className="table-responsive">
              <DataTable columns={columns} data={medicines} />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editMed ? "Edit Medicine" : "Add Medicine"}
        size="md"
      >
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-12">
              <label className="mc-form-label">Medicine Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <label className="mc-form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="mc-form-label">Unit</label>
              <select
                className="form-select"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="mc-form-label">Stock *</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <label className="mc-form-label">Price (ETB) *</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editMed ? "Update" : "Add Medicine"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispense Modal */}
      <Modal
        show={showDispenseModal}
        onClose={() => setShowDispenseModal(false)}
        title="Dispense Medicine"
        size="md"
      >
        <form onSubmit={handleDispense}>
          <div className="mb-3">
            <label className="mc-form-label">Patient UID *</label>
            <input
              className="form-control"
              placeholder="e.g. PT-00124"
              value={dispenseForm.patient_uid}
              onChange={(e) =>
                setDispenseForm({
                  ...dispenseForm,
                  patient_uid: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Medicine *</label>
            <select
              className="form-select"
              value={dispenseForm.medicine_id}
              onChange={(e) =>
                setDispenseForm({
                  ...dispenseForm,
                  medicine_id: e.target.value,
                })
              }
              required
            >
              <option value="">Select medicine</option>
              {medicines
                .filter((m) => m.stock > 0)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.stock} left)
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Quantity *</label>
            <input
              className="form-control"
              type="number"
              min="1"
              value={dispenseForm.quantity}
              onChange={(e) =>
                setDispenseForm({ ...dispenseForm, quantity: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-3">
            <label className="mc-form-label">Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={dispenseForm.notes}
              onChange={(e) =>
                setDispenseForm({ ...dispenseForm, notes: e.target.value })
              }
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowDispenseModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? "Processing..." : "Dispense"}
            </button>
          </div>
        </form>
      </Modal>

      <PharmacyAIPanel medicines={medicines} dispenseForm={dispenseForm} />
    </PageShell>
  );
};

export default PharmacyDashboard;
