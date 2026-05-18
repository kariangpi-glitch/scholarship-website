import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import PendingVerification from './pages/PendingVerification';
import { studentMenu, adminMenu, institutionMenu } from './config/menus';

import StudentDashboard from './pages/student/StudentDashboard';
import BrowseScholarships from './pages/student/BrowseScholarships';
import ApplyScholarship from './pages/student/ApplyScholarship';
import StudentDocuments from './pages/student/StudentDocuments';
import MyApplications from './pages/student/MyApplications';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageScholarships from './pages/admin/ManageScholarships';
import AdminApplications from './pages/admin/AdminApplications';
import Announcements from './pages/admin/Announcements';
import AdminProfile from './pages/admin/AdminProfile';
import AccountVerifications from './pages/admin/AccountVerifications';
import ScholarshipApprovals from './pages/admin/ScholarshipApprovals';
import AdminStudentEligibility from './pages/admin/AdminStudentEligibility';

import InstDashboard from './pages/institution/InstDashboard';
import InstApplications from './pages/institution/InstApplications';
import InstScholarships from './pages/institution/InstScholarships';
import InstProfile from './pages/institution/InstProfile';
import { getAccountStatus } from './utils/userHelpers';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (getAccountStatus(user) === 'pending') return <Navigate to="/pending-verification" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <MainLayout menuItems={studentMenu} />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="browse" element={<BrowseScholarships />} />
              <Route path="apply/:id" element={<ApplyScholarship />} />
              <Route path="documents" element={<StudentDocuments />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <MainLayout menuItems={adminMenu} />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="scholarships" element={<ManageScholarships />} />
              <Route path="scholarship-requests" element={<ScholarshipApprovals />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="eligibility" element={<AdminStudentEligibility />} />
              <Route path="verifications" element={<AccountVerifications />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route
              path="/institution"
              element={
                <ProtectedRoute role="institution">
                  <MainLayout menuItems={institutionMenu} />
                </ProtectedRoute>
              }
            >
              <Route index element={<InstDashboard />} />
              <Route path="applications" element={<InstApplications />} />
              <Route path="scholarships" element={<InstScholarships />} />
              <Route path="profile" element={<InstProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
