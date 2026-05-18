import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccountStatus } from '../utils/userHelpers';

const ROLE_MESSAGES = {
  admin: {
    title: 'Administrator verification pending',
    body: 'Your registration and ID proof have been submitted. A verified administrator will review your documents before your account is activated.',
  },
  institution: {
    title: 'Institution verification pending',
    body: 'Your institution registration is under review. Once your proof of affiliation is verified, you will receive full access to the platform.',
  },
};

export default function PendingVerification() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (getAccountStatus(user) === 'active') return <Navigate to={`/${user.role}`} replace />;

  const info = ROLE_MESSAGES[user.role] || {
    title: 'Account verification pending',
    body: 'Your account is awaiting approval.',
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="pending-icon">⏳</div>
        <h1 className="page-title">{info.title}</h1>
        <p className="page-subtitle">{info.body}</p>

        {user.idProof && (
          <div className="card verification-summary">
            <h3 className="card-heading">Submitted verification</h3>
            <p><strong>Document:</strong> {user.idProof.fileName}</p>
            <p><strong>Type:</strong> {user.idProof.type}</p>
            <p><strong>Submitted:</strong> {user.idProof.submittedAt}</p>
            {user.idProof.notes && <p><strong>Notes:</strong> {user.idProof.notes}</p>}
          </div>
        )}

        <p className="cell-muted pending-note">
          Signed in as {user.email}. You will gain access once verification is complete.
        </p>

        <div className="form-actions pending-actions">
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Sign out
          </button>
          <Link to="/login" className="btn btn-primary">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
