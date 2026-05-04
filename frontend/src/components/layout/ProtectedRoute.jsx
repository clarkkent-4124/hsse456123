import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Redirect to the shared app home if logged in
function roleHome() {
  return '/admin/dashboard';
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
