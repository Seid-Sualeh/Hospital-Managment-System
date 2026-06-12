import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/Common/PrivateRoute';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../features/Auth/Login';
import AdminDashboard from '../features/Dashboard/AdminDashboard';
import PatientManagement from '../features/Patients/PatientManagement';
import PatientProfile from '../features/Patients/PatientProfile';
import AppointmentManagement from '../features/Appointments/AppointmentManagement';
import ConsultationWorkspace from '../features/Consultations/ConsultationWorkspace';
import LabWorkspace from '../features/Laboratory/LabWorkspace';
import PharmacyDashboard from '../features/Pharmacy/PharmacyDashboard';
import BillingLedger from '../features/Billing/BillingLedger';
import ReportsWorkspace from '../features/Reports/ReportsWorkspace';
import UsersManagement from '../features/Users/UsersManagement';
import SettingsPage from '../features/Settings/SettingsPage';
import WorkforceWorkspace from '../features/Workforce/WorkforceWorkspace';
import { ROLE_IDS } from '../constants/roles';
import Loader from '../components/Common/Loader';

const PublicLoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Loading..." fullPage />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicLoginRoute />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/patients"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.DOCTOR, ROLE_IDS.TRIAGE_NURSE, ROLE_IDS.RECEPTIONIST]}>
            <MainLayout>
              <PatientManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/patients/:id"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.DOCTOR, ROLE_IDS.TRIAGE_NURSE, ROLE_IDS.RECEPTIONIST]}>
            <MainLayout>
              <PatientProfile />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.DOCTOR, ROLE_IDS.RECEPTIONIST]}>
            <MainLayout>
              <AppointmentManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/consultations"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.DOCTOR]}>
            <MainLayout>
              <ConsultationWorkspace />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/labs"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.DOCTOR, ROLE_IDS.LAB_TECHNICIAN]}>
            <MainLayout>
              <LabWorkspace />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/pharmacy"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.PHARMACIST]}>
            <MainLayout>
              <PharmacyDashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.CASHIER]}>
            <MainLayout>
              <BillingLedger />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.CASHIER]}>
            <MainLayout>
              <ReportsWorkspace />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <PrivateRoute allowedRoles={[
            ROLE_IDS.ADMIN,
            ROLE_IDS.DOCTOR,
            ROLE_IDS.TRIAGE_NURSE,
            ROLE_IDS.RECEPTIONIST,
            ROLE_IDS.PHARMACIST,
            ROLE_IDS.LAB_TECHNICIAN,
            ROLE_IDS.CASHIER,
            ROLE_IDS.MIDWIFE,
          ]}>
            <MainLayout>
              <WorkforceWorkspace />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN]}>
            <MainLayout>
              <UsersManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN]}>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
