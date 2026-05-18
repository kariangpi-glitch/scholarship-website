import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccountStatus } from '../utils/userHelpers';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading your account…</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  const status = getAccountStatus(user);
  if (status === 'pending') return <Navigate to="/pending-verification" replace />;
  if (status === 'rejected') return <Navigate to="/login" replace />;

  return children;
}
