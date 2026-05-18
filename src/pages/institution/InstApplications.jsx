import { Fragment, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewer from '../../components/DocumentViewer';
import ApplicationRemarks from '../../components/ApplicationRemarks';
import {
  canStaffDeleteApplication,
  isWithdrawn,
  getApplicationDocuments,
  getStudentGeneralDocuments,
  allApplicationDocsVerified,
  allGeneralDocsVerified,
} from '../../utils/applicationHelpers';

export default function InstApplications() {
  const { user } = useAuth();
  const {
    getApplications,
    getScholarships,
    getDocuments,
    updateApplication,
    updateDocument,
    deleteApplication,
    addApplicationRemark,
    tick,
  } = useData();
  void tick;

  const [viewDoc, setViewDoc] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const instSchIds = getScholarships()
    .filter((s) => s.institutionId === user.id)
    .map((s) => s.id);

  const apps = getApplications().filter(
    (a) =>
      !isWithdrawn(a) &&
      (instSchIds.includes(a.scholarshipId) || a.status === 'institution-review')
  );

  const allDocs = getDocuments();

  const verifyDoc = (docId) => {
    updateDocument(docId, { verified: true, verifiedBy: user.id });
  };

  const verifyAndForward = (app) => {
    const generalOk = allGeneralDocsVerified(allDocs, app.studentId);
    const eligibilityOk = allApplicationDocsVerified(allDocs, app.id);
    if (!generalOk || !eligibilityOk) return;
    updateApplication(app.id, {
      institutionStatus: 'verified',
      status: 'pending',
      forwardedToAdmin: true,
    });
  };

  const postRemark = (app, text) => {
    addApplicationRemark(app.id, {
      authorId: user.id,
      authorName: user.name,
      authorRole: 'institution',
      text,
    });
  };

  const renderDocList = (docs, label) => (
    <div className="status-docs-cell__docs">
      <span className="status-docs-cell__label">{label}</span>
      {docs.length === 0 ? (
        <p className="status-docs-cell__empty">None uploaded</p>
      ) : (
        <ul className="doc-verify-list">
          {docs.map((d) => (
            <li key={d.id} className="doc-verify-item">
              <span className="doc-verify-item__name" title={d.name}>{d.name}</span>
              <span className="doc-verify-item__type">{d.type}</span>
              {d.fileData && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setViewDoc(d)}>
                  View
                </button>
              )}
              {d.verified ? (
                <StatusBadge status="approved" />
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => verifyDoc(d.id)}>
                  Verify
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Application Review</h2>
        <p className="page-subtitle">
          Verify documents, send remarks to students (e.g. request more uploads), then forward complete applications to administration.
        </p>
      </div>

      <div className="table-wrap card">
        <table className="data-table inst-apps-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Scholarship</th>
              <th>Applied</th>
              <th>Status &amp; Documents</th>
              <th>Fund</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-text">No applications to review.</td>
              </tr>
            ) : (
              apps.map((a) => {
                const generalDocs = getStudentGeneralDocuments(allDocs, a.studentId);
                const appDocs = getApplicationDocuments(allDocs, a.id);
                const generalOk = allGeneralDocsVerified(allDocs, a.studentId);
                const eligibilityOk = allApplicationDocsVerified(allDocs, a.id);
                const isForwarded = a.forwardedToAdmin === true;
                const canForward =
                  generalOk && eligibilityOk && a.status === 'institution-review' && !isForwarded;
                const expanded = expandedId === a.id;

                return (
                  <Fragment key={a.id}>
                    <tr>
                      <td>
                        <strong>{a.studentName}</strong>
                        <br />
                        <small>{a.studentEmail}</small>
                      </td>
                      <td>{a.scholarshipTitle}</td>
                      <td>{a.appliedAt}</td>
                      <td className="status-docs-cell">
                        <div className="status-docs-cell__status">
                          <span className="status-docs-cell__label">Application</span>
                          <StatusBadge status={a.status} />
                          {isForwarded && <StatusBadge status="forwarded" />}
                        </div>
                        {renderDocList(
                          generalDocs,
                          `General docs (${generalDocs.filter((d) => d.verified).length}/${generalDocs.length})`
                        )}
                        {renderDocList(
                          appDocs,
                          `Eligibility proof (${appDocs.filter((d) => d.verified).length}/${appDocs.length})`
                        )}
                      </td>
                      <td>
                        {a.fundStatus === 'sent' && <StatusBadge status="fund-sent" />}
                        {a.fundStatus === 'received' && <StatusBadge status="fund-received" />}
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setExpandedId(expanded ? null : a.id)}
                        >
                          {expanded ? 'Hide' : 'Send remark'}
                        </button>
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
                          <span className="cell-muted">Forwarded</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={!canForward}
                            title={
                              !generalOk
                                ? 'Verify all general documents'
                                : !eligibilityOk
                                  ? 'Verify all eligibility documents for this scholarship'
                                  : 'Submit to administration'
                            }
                            onClick={() => verifyAndForward(a)}
                          >
                            Forward to Admin
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="app-detail-row">
                        <td colSpan={6}>
                          <ApplicationRemarks
                            application={a}
                            canPost
                            onAddRemark={(text) => postRemark(a, text)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
