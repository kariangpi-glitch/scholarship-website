import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewer from '../../components/DocumentViewer';

export default function AccountVerifications() {
  const { getPendingAccounts, reviewAccount } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [viewProof, setViewProof] = useState(null);
  void refresh;

  const pending = getPendingAccounts();

  const handleReview = (userId, approved) => {
    const action = approved ? 'approve' : 'decline';
    if (!window.confirm(`Are you sure you want to ${action} this account after reviewing ID proof?`)) return;
    reviewAccount(userId, approved);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Account verification</h2>
        <p className="page-subtitle">
          Open and review ID proof documents before approving administrator or institution registrations.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state__title">No pending verifications</p>
        </div>
      ) : (
        <div className="verification-grid">
          {pending.map((u) => (
            <article key={u.id} className="card verification-card">
              <div className="verification-card__header">
                <div>
                  <h3>{u.name}</h3>
                  <p className="cell-secondary">{u.email}</p>
                </div>
                <StatusBadge status="pending" label="Awaiting review" />
              </div>
              <dl className="verification-details">
                <dt>Account type</dt>
                <dd className="capitalize">{u.role}</dd>
                <dt>Phone</dt>
                <dd>{u.phone || '—'}</dd>
                {u.role === 'admin' && (
                  <>
                    <dt>Department</dt>
                    <dd>{u.department || '—'}</dd>
                    <dt>Organization</dt>
                    <dd>{u.organization || '—'}</dd>
                  </>
                )}
                {u.role === 'institution' && (
                  <>
                    <dt>Contact</dt>
                    <dd>{u.contactPerson || '—'}</dd>
                    <dt>Address</dt>
                    <dd>{u.address || '—'}</dd>
                  </>
                )}
                {u.idProof && (
                  <>
                    <dt>ID proof file</dt>
                    <dd>{u.idProof.fileName}</dd>
                  </>
                )}
              </dl>
              {u.idProof?.fileData && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewProof({ name: u.idProof.fileName, fileData: u.idProof.fileData, mimeType: u.idProof.mimeType })}
                >
                  View ID proof
                </button>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={() => handleReview(u.id, true)}>
                  Approve after review
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleReview(u.id, false)}>
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {viewProof && <DocumentViewer doc={viewProof} onClose={() => setViewProof(null)} />}
    </div>
  );
}
