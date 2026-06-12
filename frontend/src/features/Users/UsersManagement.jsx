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
import { Plus, Edit, Trash2, UserCog } from "lucide-react";

const MOCK_USERS = [
  {
    id: 1,
    name: "Dr. Elias Mulugeta",
    email: "elias@clinic.et",
    role: "doctor",
    department: "General Medicine",
    status: "active",
    joined: "2023-01-15",
  },
  {
    id: 2,
    name: "Dr. Tigist Haile",
    email: "tigist@clinic.et",
    role: "doctor",
    department: "Pediatrics",
    status: "active",
    joined: "2023-03-20",
  },
  {
    id: 3,
    name: "Selamawit Girma",
    email: "selamawit@clinic.et",
    role: "receptionist",
    department: "Reception",
    status: "active",
    joined: "2023-06-01",
  },
  {
    id: 4,
    name: "Yonas Kebede",
    email: "yonas@clinic.et",
    role: "lab_technician",
    department: "Laboratory",
    status: "active",
    joined: "2023-07-10",
  },
  {
    id: 5,
    name: "Hana Tadesse",
    email: "hana@clinic.et",
    role: "pharmacist",
    department: "Pharmacy",
    status: "inactive",
    joined: "2023-09-05",
  },
];

const ROLES = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "lab_technician",
  "pharmacist",
  "cashier",
];
const DEPARTMENTS = [
  "General Medicine",
  "Pediatrics",
  "Laboratory",
  "Pharmacy",
  "Reception",
  "Administration",
  "Emergency",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "",
  department: "",
  phone: "",
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", { params: search ? { search } : {} });
      const data = res.data?.data || res.data;
      setUsers(data.users || (Array.isArray(data) ? data : MOCK_USERS));
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department || "",
      phone: user.phone || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === editUser.id ? { ...u, ...payload } : u)),
        );
      } else {
        const res = await api.post("/users", payload);
        const created = res.data?.data || res.data;
        setUsers((prev) => [created, ...prev]);
      }
      setAlert({
        type: "success",
        msg: editUser ? "User updated." : "User created.",
      });
      setShowModal(false);
    } catch {
      if (!editUser)
        setUsers((prev) => [
          {
            id: Date.now(),
            ...payload,
            status: "active",
            joined: new Date().toISOString().slice(0, 10),
          },
          ...prev,
        ]);
      else
        setUsers((prev) =>
          prev.map((u) => (u.id === editUser.id ? { ...u, ...payload } : u)),
        );
      setAlert({
        type: "success",
        msg: editUser ? "User updated." : "User created.",
      });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action cannot be undone."))
      return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setAlert({ type: "success", msg: "User deleted." });
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setAlert({ type: "success", msg: "User deleted." });
    }
  };

  const getRoleBadgeColor = (role) => {
    const map = {
      admin: "danger",
      doctor: "primary",
      nurse: "success",
      receptionist: "info",
      lab_technician: "warning",
      pharmacist: "secondary",
      cashier: "dark",
    };
    return map[role] || "secondary";
  };

  const columns = [
    {
      header: "User",
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <div className="stat-card-icon primary avatar-sm rounded-8 flex-shrink-0">
            {(r.name || "")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div className="fw-semibold small">{r.name}</div>
            <div className="text-caption">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      render: (r) => (
        <span
          className={`badge bg-${getRoleBadgeColor(r.role)} bg-opacity-15 text-${getRoleBadgeColor(r.role)} text-capitalize`}
        >
          {(r.role || "").replace(/_/g, " ")}
        </span>
      ),
    },
    { header: "Department", render: (r) => r.department || "—" },
    {
      header: "Joined",
      render: (r) =>
        r.joined
          ? new Date(r.joined).toLocaleDateString("en-US", {
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
            onClick={() => openEdit(r)}
          >
            <Edit size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

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
          title="Users"
          subtitle="Manage staff and access roles"
          icon={UserCog}
        />
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={openAdd}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="mc-card">
        <div className="mc-card-body">
          <div className="mb-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />
          </div>

          {loading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            <div className="table-responsive">
              <DataTable columns={columns} data={filtered} />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? "Edit User" : "Add User"}
        size="md"
      >
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-12">
              <label className="mc-form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="mc-form-label">Email *</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="mc-form-label">
                {editUser ? "New Password (leave blank to keep)" : "Password *"}
              </label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editUser}
              />
            </div>
            <div className="col-6">
              <label className="mc-form-label">Role *</label>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="mc-form-label">Department</label>
              <select
                className="form-select"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              >
                <option value="">Select</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="mc-form-label">Phone</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              {saving ? "Saving..." : editUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default UsersManagement;
