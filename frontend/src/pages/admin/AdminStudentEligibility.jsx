import { useState } from 'react';
import { KEYS, getItem } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { studentIsBlockedFromApplying } from '../../utils/fundHelpers';

export default function AdminStudentEligibility() {
  const { user } = useAuth();
  const {
    getApplications,
    getFundRecords,
    allowStudentReapply,
    resetAllStudentsEligibility,
    tick,
  } = useData();
  void tick;

  const [msg, setMsg] = useState('');
  const applications = getApplications();
  const fundRecords = getFundRecords();
  const blockedFundRecords = fundRecords.filter((r) => r.reapplyAllowed !== true);
  const students = getItem(KEYS.users, []).filter((u) => u.role === 'student');

  const blockedStudents = students.filter((s) =>
    studentIsBlockedFromApplying(s,blockedFundRecords, applications)
  );

  const allowedAgain = students.filter(
    (s) =>
      s.hasReceivedScholarshipFund &&
      s.scholarshipReapplyAllowed === true
  );

  const handleResetAll = () => {
    if (
      !window.confirm(
        'Allow all students who previously received funds to apply for new scholarships again?'
      )
    ) {
      return;
    }
    resetAllStudentsEligibility(user.name);
    setMsg('Students who received funds may now apply again for new programs.');
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Student eligibility &amp; fund records</h2>
        <p className="page-subtitle">
          Students who confirmed fund receipt stay blocked even if scholarships or applications are deleted.
          Use the ledger below and allow re-apply when starting a new cycle.
        </p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3 className="card-heading">Fund disbursement record</h3>
        <p className="signup-section-desc">
          Permanent record of students who received scholarship funds. Not removed when programs are deleted.
        </p>
        {blockedFundRecords.length === 0 ? (
          <p className="empty-text">No fund disbursements recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Fund sent</th>
                  <th>Fund received</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {blockedFundRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="cell-primary">{r.studentName}</span>
                      <span className="cell-secondary">{r.studentEmail}</span>
                    </td>
                    <td>{r.scholarshipTitle}</td>
                    <td>{r.amount != null ? `$${Number(r.amount).toLocaleString()}` : '—'}</td>
                    <td>{r.fundSentAt || '—'}</td>
                    <td>{r.fundReceivedAt || '—'}</td>
                    <td>{r.recordedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h3 className="card-heading">Reset scholarship cycle</h3>
        <p className="signup-section-desc">
          Allows every student who previously received funds to apply for new scholarships again.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleResetAll}>
          Allow all fund recipients to apply again
        </button>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
  <h3 className="card-heading">Blocked from applying</h3>

  {fundRecords.filter((r) => r.reapplyAllowed !== true).length === 0 ? (
    <p className="empty-text">No students are currently blocked.</p>
  ) : (
    <table className="data-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Last program</th>
          <th>Fund received</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
      {fundRecords
  .filter((r) => r.reapplyAllowed !== true)
  .map((r) => ( 
          <tr key={r.id}>
            <td>{r.studentName}</td>

            <td>{r.studentEmail}</td>

            <td>{r.scholarshipTitle || '—'}</td>

            <td>{r.fundReceivedAt || '—'}</td>

            <td>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  allowStudentReapply(r.studentId, user.name);

                  setMsg(`${r.studentName} may apply again.`);
                }}
              >
                Allow to apply again
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      {allowedAgain.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <h3 className="card-heading">Allowed to apply again</h3>
          <p className="signup-section-desc">
            These students received funds before but may apply for new programs in the current cycle.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Last program</th>
                <th>Fund received</th>
              </tr>
            </thead>
            <tbody>
              {allowedAgain.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.lastReceivedScholarshipTitle || '—'}</td>
                  <td>{s.scholarshipFundReceivedAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
