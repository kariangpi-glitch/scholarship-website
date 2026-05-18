import { useState } from 'react';
import { KEYS, getItem } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import {
  filterApplicationsForAdmin,
  canAdminDecide,
  isFinalized,
  canApproveApplication,
  canSendFund,
  canSendFundToStudent,
  canStaffDeleteApplication,
  studentHasReceivedFund,
} from '../../utils/applicationHelpers';
import { detectBankFraud } from '../../utils/bankHelpers';

export default function AdminApplications() {
  const { user } = useAuth();
  const {
    getApplications,
    getFundRecords,
    getDocuments,
    updateApplication,
    sendFund,
    deleteApplication,
    allowStudentReapply,
    tick,
  } = useData();
  void tick;

  const [msg, setMsg] = useState('');
  const [fundBlock, setFundBlock] = useState(null);

  const allApplications = getApplications();
  const fundRecords = getFundRecords();
  const apps = filterApplicationsForAdmin(allApplications);
  const documents = getDocuments();

  const getStudent = (id) => getItem(KEYS.users, []).find((u) => u.id === id);

  const handleDecision = (app, status) => {
    const student = getStudent(app.studentId);
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
      const otherApproved = allApplications.filter(
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

  const handleSendFund = (app) => {
    const check = canSendFundToStudent(app, allApplications, fundRecords, getStudent(app.studentId));
    if (!check.ok) {
      setFundBlock({ app, prior: check.priorApplication, reason: check.reason });
      return;
    }
    const result = sendFund(app.id);
    if (!result.ok) {
      setFundBlock({ app, prior: result.priorApplication, reason: result.reason });
      return;
    }
    setMsg('');
    setFundBlock(null);
  };

  const handleDeleteBlocked = () => {
    if (!fundBlock) return;
    deleteApplication(fundBlock.app.id);
    setFundBlock(null);
    setMsg('Application removed. Student was notified that they already received a scholarship fund.');
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
          Approve when bank details and verified identity are on file. Sending funds is blocked if the student already received a scholarship.
        </p>
      </div>
      {msg && <div className="alert alert-error">{msg}</div>}

      {fundBlock && (
        <div className="card alert alert-error fund-block-modal">
          <p><strong>Cannot send fund.</strong> {fundBlock.reason}</p>
          <p className="cell-muted">
            Student already received funds for &ldquo;{fundBlock.prior?.scholarshipTitle}&rdquo;.
            A notification has been sent to the student.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={handleDeleteBlocked}>
              Delete this application
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                allowStudentReapply(fundBlock.app.studentId, user.name);
                setFundBlock(null);
                setMsg('Student may apply again. You can send funds after they select a new award.');
              }}
            >
              Allow student to apply again
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFundBlock(null)}>
              Close
            </button>
          </div>
        </div>
      )}

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
                const alreadyFunded = studentHasReceivedFund(
                  allApplications,
                  a.studentId,
                  getStudent(a.studentId),
                  fundRecords
                );
                return (
                    <tr key={a.id}>
                      <td>
                        <span className="cell-primary">{a.studentName}</span>
                        <span className="cell-secondary">{a.studentEmail}</span>
                        {!bankOk && <span className="fraud-flag">No bank details</span>}
                        {alreadyFunded && (
                          <span className="fraud-flag">Prior fund received</span>
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
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSendFund(a)}>
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
