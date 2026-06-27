import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/Common/PrivateRoute';
import MainLayout from '../components/Layout/MainLayout';

// Lazy loaded page components for chunk loading
const Login = lazy(() => import('../features/Auth/Login'));
const AdminDashboard = lazy(() => import('../features/Dashboard/AdminDashboard'));
const PatientManagement = lazy(() => import('../features/Patients/PatientManagement'));
const PatientProfile = lazy(() => import('../features/Patients/PatientProfile'));
const AppointmentManagement = lazy(() => import('../features/Appointments/AppointmentManagement'));
const ConsultationWorkspace = lazy(() => import('../features/Consultations/ConsultationWorkspace'));
const LabWorkspace = lazy(() => import('../features/Laboratory/LabWorkspace'));
const PharmacyDashboard = lazy(() => import('../features/Pharmacy/PharmacyDashboard'));
const BillingLedger = lazy(() => import('../features/Billing/BillingLedger'));
const ReportsWorkspace = lazy(() => import('../features/Reports/ReportsWorkspace'));
const UsersManagement = lazy(() => import('../features/Users/UsersManagement'));
const SettingsPage = lazy(() => import('../features/Settings/SettingsPage'));
const WorkforceWorkspace = lazy(() => import('../features/Workforce/WorkforceWorkspace'));
const TriageDesk = lazy(() => import('../features/Triage/TriageDesk'));
const PublicLayout = lazy(() => import('../features/Public/PublicLayout'));
const LandingPage = lazy(() => import('../features/Public/LandingPage'));
const AboutPage = lazy(() => import('../features/Public/AboutPage'));
const FeaturesPage = lazy(() => import('../features/Public/FeaturesPage'));
const ServicesPage = lazy(() => import('../features/Public/ServicesPage'));
const ContactPage = lazy(() => import('../features/Public/ContactPage'));

import { ROLE_IDS } from '../constants/roles';
import Loader from '../components/Common/Loader';
import useDocumentMetadata from '../hooks/useDocumentMetadata';


const PublicLoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Loading..." fullPage />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

const AppRoutes = () => {
  useDocumentMetadata();
  return (
    <Suspense fallback={<Loader message="Loading workspace..." fullPage />}>
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
          path="/triage"
          element={
            <PrivateRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.TRIAGE_NURSE]}>
              <MainLayout>
                <TriageDesk />
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

        {/* Public Landing Pages */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
