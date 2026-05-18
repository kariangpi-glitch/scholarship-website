import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import {
  getStudentApprovedApps,
  studentNeedsAwardSelection,
  canMarkFundReceived,
  canWithdraw,
  canStudentDeleteApplication,
  isWithdrawn,
} from '../../utils/applicationHelpers';

export default function MyApplications() {
  const { user } = useAuth();
  const {
    getApplications,
    selectAward,
    markFundReceived,
    withdrawApplication,
    deleteApplication,
    tick,
  } = useData();
  void tick;

  const apps = getApplications().filter((a) => a.studentId === user.id && a.status !== 'withdrawn');
  const withdrawn = getApplications().filter((a) => a.studentId === user.id && isWithdrawn(a));
  const approved = getStudentApprovedApps(getApplications().filter((a) => a.studentId === user.id), user.id);
  const needsChoice = studentNeedsAwardSelection(
    getApplications().filter((a) => a.studentId === user.id),
    user.id
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleWithdraw = (id) => {
    if (window.confirm('Withdraw this application? You can delete it permanently after withdrawing.')) {
      withdrawApplication(id);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Permanently delete this application record?')) {
      deleteApplication(id);
    }
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">My applications</h2>
        <p className="page-subtitle">
          Track decisions, withdraw applications, and manage fund disbursement for your award.
        </p>
      </div>

      {needsChoice && (
        <div className="card alert alert-info">
          <p><strong>Multiple programs approved.</strong> You may only receive one scholarship. Select which award to accept.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowPicker(true)}>
            Choose scholarship award
          </button>
        </div>
      )}

      {showPicker && (
        <div className="card">
          <h3 className="card-heading">Select one scholarship</h3>
          {approved.filter((a) => !a.awardDeclined && !a.selectedForAward).map((a) => (
            <div key={a.id} className="award-picker-row">
              <span>{a.scholarshipTitle}</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => { selectAward(user.id, a.id); setShowPicker(false); }}>
                Accept this award
              </button>
            </div>
          ))}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-text">You have no active applications.</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Fund</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td>{a.scholarshipTitle}</td>
                  <td>{a.appliedAt}</td>
                  <td>
                    <StatusBadge status={a.status} />
                    {a.selectedForAward && <StatusBadge status="approved" label="Your award" />}
                  </td>
                  <td>
                    {a.fundStatus === 'sent' && <StatusBadge status="fund-sent" />}
                    {a.fundStatus === 'received' && <StatusBadge status="fund-received" />}
                    {!a.fundStatus && <span className="cell-muted">—</span>}
                  </td>
                  <td className="actions-cell">
                    {canWithdraw(a) && (
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleWithdraw(a.id)}>
                        Withdraw
                      </button>
                    )}
                    {canMarkFundReceived(a) && (
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => markFundReceived(a.id)}>
                        Confirm fund received
                      </button>
                    )}
                    {canStudentDeleteApplication(a) && a.fundStatus === 'received' && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {withdrawn.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <h3 className="card-heading">Withdrawn applications</h3>
          <p className="signup-section-desc">Remove records you no longer need after withdrawing.</p>
          <table className="data-table">
            <thead>
              <tr><th>Program</th><th>Withdrawn</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {withdrawn.map((a) => (
                <tr key={a.id}>
                  <td>{a.scholarshipTitle}</td>
                  <td>{a.withdrawnAt || '—'}</td>
                  <td>
                    <StatusBadge status="withdrawn" />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>
                      Delete permanently
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
