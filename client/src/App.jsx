// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./shared/hooks/useAuth";
import FacultyDashboard from "./features/faculty/pages/FacultyDashboard";
import StudentManagement from "./features/admin/pages/StudentManagement";
import FacultyManagement from "./features/admin/pages/FacultyManagement";
import ProjectManagement from "./features/admin/pages/ProjectManagement";
import PanelManagementLanding from "./features/admin/pages/PanelManagementLanding";
import AdminReports from "./features/admin/pages/AdminReports";
import AdminSettings from "./features/admin/pages/AdminSettings";
import RequestManagement from "./features/admin/pages/RequestManagement";
import AdminBroadcasts from "./features/admin/pages/AdminBroadcasts";

// Project Coordinator Pages
import CoordinatorStudentManagement from "./features/project-coordinator/pages/StudentManagement";
import CoordinatorFacultyManagement from "./features/project-coordinator/pages/FacultyManagement";
import CoordinatorProjectManagement from "./features/project-coordinator/pages/ProjectManagement";
import CoordinatorPanelManagement from "./features/project-coordinator/pages/PanelManagement";
import CoordinatorRequestManagement from "./features/project-coordinator/pages/RequestManagement";
import CoordinatorRequestAccess from "./features/project-coordinator/pages/RequestAccess";

import Login from "./features/auth/pages/Login";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import InstructionsPage from "./features/auth/pages/InstructionsPage";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<InstructionsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/students" replace />}
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <StudentManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <FacultyManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <ProjectManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/panels"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <PanelManagementLanding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <RequestManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/broadcasts"
        element={
          <ProtectedRoute allowedRoles={["admin", "coordinator"]}>
            <AdminBroadcasts />
          </ProtectedRoute>
        }
      />

      {/* Project Coordinator Routes */}
      <Route
        path="/coordinator"
        element={<Navigate to="/coordinator/students" replace />}
      />

      <Route
        path="/coordinator/students"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorStudentManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator/faculty"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorFacultyManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator/projects"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorProjectManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator/panels"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorPanelManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator/requests"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorRequestManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator/request-access"
        element={
          <ProtectedRoute allowedRoles={["project_coordinator"]}>
            <CoordinatorRequestAccess />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
