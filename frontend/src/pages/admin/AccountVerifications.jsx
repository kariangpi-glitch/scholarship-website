import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewer from '../../components/DocumentViewer';

const API_URL = 'http://127.0.0.1:5050';

export default function AccountVerifications() {
  const [pending, setPending] = useState([]);
  const [viewProof, setViewProof] = useState(null);

  const loadPendingAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/pending-accounts`);
      const data = await res.json();
      setPending(data);
    } catch (err) {
      console.error(err);
      setPending([]);
    }
  };

  useEffect(() => {
    loadPendingAccounts();
  }, []);

  const handleReview = async (userId, approved) => {
    const action = approved ? 'approve' : 'decline';

    if (!window.confirm(`Are you sure you want to ${action} this account?`)) {
      return;
    }

    const url = approved
      ? `${API_URL}/approve-account/${userId}`
      : `${API_URL}/reject-account/${userId}`;

    await fetch(url, {
      method: 'PUT',
    });

    loadPendingAccounts();
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Account verification</h2>
        <p className="page-subtitle">
          Review department and administrator registrations before approving access.
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
                    <dd>{u.contact_person || u.contactPerson || '—'}</dd>

                    <dt>Address</dt>
                    <dd>{u.address || '—'}</dd>
                  </>
                )}

                 {u.idProof && (
                  <>
                    <dt>ID proof</dt>
                    <dd>Submitted</dd>
                  </>
                )}
              </dl>

              {u.idProof?.fileData && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setViewProof({
                      name: u.idProof.fileName,
                      fileData: u.idProof.fileData,
                      mimeType: u.idProof.mimeType,
                    })
                  }
                >
                  View ID proof
                </button>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleReview(u.id, true)}
                >
                  Approve after review
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleReview(u.id, false)}
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewProof && (
        <DocumentViewer doc={viewProof} onClose={() => setViewProof(null)} />
      )}
    </div>
  );
}