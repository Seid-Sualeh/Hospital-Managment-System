/**
 * Role IDs align with backend seed (roles table).
 * Display names match MediCare design spec where applicable.
 */
export const ROLE_IDS = {
  ADMIN: 1,
  DOCTOR: 2,
  TRIAGE_NURSE: 3,
  RECEPTIONIST: 4,
  PHARMACIST: 5,
  LAB_TECHNICIAN: 6,
  CASHIER: 7,
  MIDWIFE: 8,
};

export const ROLE_LABELS = {
  [ROLE_IDS.ADMIN]: "Admin",
  [ROLE_IDS.DOCTOR]: "Doctor",
  [ROLE_IDS.TRIAGE_NURSE]: "Triage Nurse",
  [ROLE_IDS.RECEPTIONIST]: "Receptionist",
  [ROLE_IDS.PHARMACIST]: "Pharmacist",
  [ROLE_IDS.LAB_TECHNICIAN]: "Laboratory Technician",
  [ROLE_IDS.CASHIER]: "Cashier",
  [ROLE_IDS.MIDWIFE]: "Midwife",
};

/** UI alias: accountant workflows map to receptionist + admin billing access */
export const getRoleDisplayName = (user) => {
  if (!user) return "Guest";
  const id = user.role?.id ?? user.role_id;
  const name = user.role?.name ?? user.role_name;
  if (name) {
    if (name.includes("Administrator")) return "Super Admin";
    if (name.includes("Doctor")) return "Doctor";
    if (name.includes("Receptionist")) return "Receptionist";
    if (name.includes("Pharmacist")) return "Pharmacist";
    if (name.includes("Technician") || name.includes("Laboratory")) return "Lab Technician";
    if (name.includes("Cashier")) return "Cashier";
    if (name.includes("Triage") || name.includes("Nurse")) return "Triage Nurse";
    if (name.includes("Midwife") || name.includes("Midwifery")) return "Midwife";
  }
  return ROLE_LABELS[id] || name || "Staff";
};

export const canAccessRoute = (user, allowedRoles) => {
  if (!user || !allowedRoles?.length) return true;
  const roleId = user.role?.id ?? user.role_id;
  if (roleId === ROLE_IDS.ADMIN) return true;
  return allowedRoles.includes(roleId);
};
