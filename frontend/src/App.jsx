import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import ViewerLayout from './components/layout/ViewerLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import LaporanPage from './pages/admin/LaporanPage';
import SWAPage from './pages/admin/SWAPage';
import AdminHistoryPage from './pages/admin/HistoryPage';
import UserPage from './pages/admin/UserPage';
import UserDashboardPage from './pages/user/DashboardPage';
import ViewerDashboardPage from './pages/viewer/DashboardPage';

// Redirect root → role-based home
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'user')  return <Navigate to="/user/dashboard"  replace />;
  return <Navigate to="/dashboard" replace />;
}

// Redirect already-logged-in users away from /login
function LoginGuard() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'user')  return <Navigate to="/user/dashboard"  replace />;
  return <Navigate to="/dashboard" replace />;
}

// Root app wrapper — applies data-theme from ThemeContext
function AppContent() {
  const { theme } = useTheme();
  return (
    <div data-theme={theme}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginGuard />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Admin routes (sidebar layout) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"           element={<AdminDashboardPage />} />
          <Route path="laporan_pengawasan"  element={<LaporanPage />} />
          <Route path="swa"                 element={<SWAPage />} />
          <Route path="history"             element={<AdminHistoryPage />} />
          <Route path="user"                element={<UserPage />} />
        </Route>

        {/* User routes (same admin layout, limited access) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
        </Route>

        {/* Viewer routes (mobile layout) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['viewer']}>
              <ViewerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ViewerDashboardPage />} />
        </Route>

        {/* Catch-all */}
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
