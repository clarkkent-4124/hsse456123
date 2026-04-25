import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Redirect to role-specific home if logged in
function roleHome(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'user')  return '/user/dashboard';
  return '/dashboard';
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
