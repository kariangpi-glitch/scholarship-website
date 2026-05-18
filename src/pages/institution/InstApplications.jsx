import { useState } from 'react';
import { KEYS, getItem } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewer from '../../components/DocumentViewer';
import {
  canInstitutionApproveIdentity,
  getIdentityVerificationSummary,
} from '../../utils/bankHelpers';
import { canStaffDeleteApplication, isWithdrawn } from '../../utils/applicationHelpers';

export default function InstApplications() {
  const { user } = useAuth();
  const {
    getApplications,
    getScholarships,
    getDocuments,
    updateApplication,
    updateDocument,
    deleteApplication,
    verifyStudentIdentity,
    tick,
  } = useData();
  void tick;
  const [viewDoc, setViewDoc] = useState(null);
  const [identityMsg, setIdentityMsg] = useState('');

  const instSchIds = getScholarships()
    .filter((s) => s.institutionId === user.id)
    .map((s) => s.id);

  const apps = getApplications().filter(
    (a) =>
      !isWithdrawn(a) &&
      (instSchIds.includes(a.scholarshipId) || a.status === 'institution-review')
  );

  const allDocs = getDocuments();
  const users = getItem(KEYS.users, []);

  const getStudent = (studentId) => users.find((u) => u.id === studentId);
  const getStudentDocs = (studentId) => allDocs.filter((d) => d.studentId === studentId);

  const verifyDoc = (docId) => {
    updateDocument(docId, { verified: true, verifiedBy: user.id });
  };

  const handleApproveIdentity = (studentId) => {
    const student = getStudent(studentId);
    const check = canInstitutionApproveIdentity(student, allDocs);
    if (!check.ok) {
      setIdentityMsg(check.reason);
      return;
    }
    const result = verifyStudentIdentity(studentId, user);
    if (!result.ok) {
      setIdentityMsg(result.reason);
      return;
    }
    setIdentityMsg(
      `Identity verified for ${student?.name || 'student'}. Administration can now approve their application.`
    );
  };

  const verifyAndForward = (app) => {
    const student = getStudent(app.studentId);
    const docs = getStudentDocs(app.studentId);
    const identity = getIdentityVerificationSummary(student, allDocs);
    if (!identity.readyForAdmin) {
      setIdentityMsg('Approve student identity (passport / photo ID) before forwarding to administration.');
      return;
    }
    const allVerified = docs.length > 0 && docs.every((d) => d.verified);
    if (!allVerified) {
      setIdentityMsg('Verify all uploaded documents before forwarding.');
      return;
    }
    setIdentityMsg('');
    updateApplication(app.id, {
      institutionStatus: 'verified',
      status: 'pending',
      forwardedToAdmin: true,
    });
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Application Review</h2>
        <p className="page-subtitle">
          Verify student identity and documents, then forward complete applications to the administration.
        </p>
      </div>

      {identityMsg && (
        <div
          className={`alert ${identityMsg.includes('Administration') ? 'alert-success' : 'alert-error'}`}
        >
          {identityMsg}
        </div>
      )}

      <div className="table-wrap card">
        <table className="data-table inst-apps-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Scholarship</th>
              <th>Applied</th>
              <th>Identity</th>
              <th>Status & Documents</th>
              <th>Fund</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-text">No applications to review.</td>
              </tr>
            ) : (
              apps.map((a) => {
                const student = getStudent(a.studentId);
                const docs = getStudentDocs(a.studentId);
                const verifiedCount = docs.filter((d) => d.verified).length;
                const allVerified = docs.length > 0 && verifiedCount === docs.length;
                const isForwarded = a.forwardedToAdmin === true;
                const canForward = allVerified && a.status === 'institution-review' && !isForwarded;
                const identity = getIdentityVerificationSummary(student, allDocs);
                const canApproveIdentity = canInstitutionApproveIdentity(student, allDocs).ok;

                return (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.studentName}</strong>
                      <br />
                      <small>{a.studentEmail}</small>
                    </td>
                    <td>{a.scholarshipTitle}</td>
                    <td>{a.appliedAt}</td>
                    <td className="identity-cell">
                      {identity.readyForAdmin ? (
                        <>
                          <StatusBadge status="verified" label="Identity verified" />
                          {identity.institutionName && (
                            <small className="identity-cell__meta">
                              By {identity.institutionName}
                              {identity.verifiedAt ? ` · ${identity.verifiedAt}` : ''}
                            </small>
                          )}
                        </>
                      ) : identity.hasUpload ? (
                        <>
                          <StatusBadge status="pending" label="Awaiting verification" />
                          {canApproveIdentity && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary identity-cell__btn"
                              onClick={() => handleApproveIdentity(a.studentId)}
                            >
                              Verify identity
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="cell-muted">No ID uploaded</span>
                      )}
                    </td>
                    <td className="status-docs-cell">
                      <div className="status-docs-cell__status">
                        <span className="status-docs-cell__label">Application</span>
                        <StatusBadge status={a.status} />
                        {isForwarded && <StatusBadge status="forwarded" />}
                        {!isForwarded && a.institutionStatus === 'verified' && (
                          <StatusBadge status="verified" />
                        )}
                      </div>
                      <div className="status-docs-cell__docs">
                        <span className="status-docs-cell__label">
                          Documents {docs.length > 0 && `(${verifiedCount}/${docs.length})`}
                        </span>
                        {docs.length === 0 ? (
                          <p className="status-docs-cell__empty">No documents uploaded</p>
                        ) : (
                          <ul className="doc-verify-list">
                            {docs.map((d) => (
                              <li key={d.id} className="doc-verify-item">
                                <span className="doc-verify-item__name" title={d.name}>
                                  {d.name}
                                </span>
                                <span className="doc-verify-item__type">{d.type}</span>
                                {d.fileData && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setViewDoc(d)}
                                  >
                                    View
                                  </button>
                                )}
                                {d.verified ? (
                                  <StatusBadge status="approved" />
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => verifyDoc(d.id)}
                                  >
                                    Verify
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                    <td>
                      {a.fundStatus === 'sent' && <StatusBadge status="fund-sent" />}
                      {a.fundStatus === 'received' && <StatusBadge status="fund-received" />}
                    </td>
                    <td className="actions-cell">
                      {(canStaffDeleteApplication(a) || a.institutionStatus === 'verified' || a.forwardedToAdmin) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Delete this application record?')) deleteApplication(a.id);
                          }}
                        >
                          Delete
                        </button>
                      )}
                      {isForwarded ? (
                        <span className="cell-muted">Forwarded to administration</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={!canForward}
                          title={
                            !identity.readyForAdmin
                              ? 'Verify student identity first'
                              : !allVerified
                                ? 'Verify all documents before forwarding'
                                : 'Submit to administration for final review'
                          }
                          onClick={() => verifyAndForward(a)}
                        >
                          Forward to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {viewDoc && <DocumentViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  );
}
