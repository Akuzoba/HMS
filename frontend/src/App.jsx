import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientRegistrationPage from './pages/front-desk/PatientRegistrationPage';
import PatientLookupPage from './pages/front-desk/PatientLookupPage';
import PatientProfilePage from './pages/patients/PatientProfilePage';
import TriagePage from './pages/triage/TriagePage';
import ConsultationPage from './pages/doctor/ConsultationPage';
import PharmacyPage from './pages/pharmacy/PharmacyPage';
import LabPage from './pages/lab/LabPage';
import BillingPage from './pages/billing/BillingPage';
import ServicesPage from './pages/billing/ServicesPage';
import IPDPage from './pages/ipd/IPDPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role?.name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Front Desk Routes */}
        <Route
          path="/patients/register"
          element={
            <ProtectedRoute allowedRoles={['FRONT_DESK', 'ADMIN']}>
              <PatientRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/patients/lookup" element={<PatientLookupPage />} />
        <Route path="/patients/:id" element={<PatientProfilePage />} />

        {/* Triage Routes */}
        <Route
          path="/triage"
          element={
            <ProtectedRoute allowedRoles={['NURSE', 'ADMIN']}>
              <TriagePage />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/consultation"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <ConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultation/:visitId"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <ConsultationPage />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Routes */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
              <PharmacyPage />
            </ProtectedRoute>
          }
        />

        {/* Lab Routes */}
        <Route
          path="/lab"
          element={
            <ProtectedRoute allowedRoles={['LAB_TECH', 'ADMIN']}>
              <LabPage />
            </ProtectedRoute>
          }
        />

        {/* Billing Routes */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_CLERK', 'ADMIN']}>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={['BILLING_CLERK', 'ADMIN']}>
              <ServicesPage />
            </ProtectedRoute>
          }
        />

        {/* IPD Routes */}
        <Route
          path="/ipd"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN']}>
              <IPDPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
