import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import LoginPage from "@/pages/LoginPage";
import ExplorerPage from "@/pages/ExplorerPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminConfigPage from "@/pages/AdminConfigPage";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <AppHeader />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell>
              <ExplorerPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Shell>
              <DashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Shell>
              <AdminConfigPage />
            </Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
