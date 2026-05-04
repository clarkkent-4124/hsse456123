import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import LaporanPage from './pages/admin/LaporanPage';
import SWAPage from './pages/admin/SWAPage';
import AdminHistoryPage from './pages/admin/HistoryPage';
import UserPage from './pages/admin/UserPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function LoginGuard() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <Navigate to="/admin/dashboard" replace />;
}

function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme}>
      <Routes>
        <Route path="/login" element={<LoginGuard />} />
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user', 'viewer']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="laporan_pengawasan" element={<LaporanPage />} />
          <Route path="swa" element={<SWAPage />} />
          <Route path="history" element={<AdminHistoryPage />} />
          <Route
            path="user"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user', 'viewer']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user', 'viewer']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
