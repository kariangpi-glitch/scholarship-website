import { useState } from 'react';
import { KEYS, getItem } from '../../utils/storage';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import {
  filterApplicationsForAdmin,
  canAdminDecide,
  isFinalized,
  canApproveApplication,
  canSendFund,
  canStaffDeleteApplication,
} from '../../utils/applicationHelpers';
import { detectBankFraud, getIdentityVerificationSummary } from '../../utils/bankHelpers';

export default function AdminApplications() {
  const { getApplications, getDocuments, updateApplication, sendFund, deleteApplication, tick } = useData();
  void tick;
  const [msg, setMsg] = useState('');

  const apps = filterApplicationsForAdmin(getApplications());
  const documents = getDocuments();

  const getStudent = (id) => getItem(KEYS.users, []).find((u) => u.id === id);

  const handleDecision = (app, status) => {
    const student = getStudent(app.studentId);
    const allApps = getApplications();
    if (status === 'approved') {
      const check = canApproveApplication(app, student, documents);
      if (!check.ok) {
        setMsg(check.reason);
        return;
      }
      const fraud = detectBankFraud(student.id, student.bankAccount);
      if (fraud.length > 0) {
        setMsg(`Fraud warning: ${fraud[0].message} Review before approving.`);
      }
      const otherApproved = allApps.filter(
        (a) => a.studentId === app.studentId && a.id !== app.id && a.status === 'approved'
      );
      const updates = { status: 'approved' };
      if (otherApproved.length === 0) updates.selectedForAward = true;
      setMsg('');
      updateApplication(app.id, updates);
      return;
    }
    setMsg('');
    updateApplication(app.id, { status });
  };

  const fundLabel = (app) => {
    if (app.fundStatus === 'sent') return <StatusBadge status="fund-sent" />;
    if (app.fundStatus === 'received') return <StatusBadge status="fund-received" />;
    return <span className="cell-muted">—</span>;
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Application review</h2>
        <p className="page-subtitle">
          Approve only when bank details and institution-verified identity are on file. Send funds after the student selects one award.
        </p>
      </div>
      {msg && <div className="alert alert-error">{msg}</div>}

      {apps.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state__title">No applications in queue</p>
        </div>
      ) : (
        <div className="table-wrap card card--elevated">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Program</th>
                <th>Decision</th>
                <th>Award</th>
                <th>Fund</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const student = getStudent(a.studentId);
                const bankOk = student?.bankAccount?.accountNumber;
                const identity = getIdentityVerificationSummary(student, documents);
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="cell-primary">{a.studentName}</span>
                      <span className="cell-secondary">{a.studentEmail}</span>
                      {!bankOk && <span className="fraud-flag">No bank details</span>}
                      {identity.readyForAdmin ? (
                        <span className="identity-flag identity-flag--ok">
                          Identity verified
                          {identity.institutionName ? ` by ${identity.institutionName}` : ''}
                        </span>
                      ) : (
                        <span className="fraud-flag">Identity not verified by institution</span>
                      )}
                    </td>
                    <td>{a.scholarshipTitle}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {a.selectedForAward ? (
                        <StatusBadge status="approved" label="Selected" />
                      ) : a.awardDeclined ? (
                        <span className="cell-muted">Not selected</span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>{fundLabel(a)}</td>
                    <td className="actions-cell">
                      {canAdminDecide(a) && (
                        <>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleDecision(a, 'approved')}>
                            Approve
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDecision(a, 'rejected')}>
                            Decline
                          </button>
                        </>
                      )}
                      {isFinalized(a) && !a.fundStatus && a.selectedForAward && a.status === 'approved' && (
                        <span className="cell-muted">Awaiting fund send</span>
                      )}
                      {canSendFund(a) && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => sendFund(a.id)}>
                          Send fund
                        </button>
                      )}
                      {canStaffDeleteApplication(a) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Remove this application from the system?')) deleteApplication(a.id);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
