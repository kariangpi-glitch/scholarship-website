import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import { isPendingInstitutionScholarship } from '../../utils/scholarshipHelpers';

export default function ScholarshipApprovals() {
  const { getScholarships, approveScholarship, deleteScholarship, tick } = useData();
  void tick;
  const pending = getScholarships().filter(isPendingInstitutionScholarship);

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Institution program requests</h2>
        <p className="page-subtitle">Review and approve scholarship programs submitted by partner institutions.</p>
      </div>
      {pending.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state__title">No pending program requests</p>
        </div>
      ) : (
        <div className="cards-grid">
          {pending.map((s) => (
            <article key={s.id} className="scholarship-card">
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <p>${Number(s.amount).toLocaleString()} · Deadline {s.deadline}</p>
              <p><strong>Institution:</strong> {s.institutionName}</p>
              <StatusBadge status="pending-approval" />
              <div className="form-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => approveScholarship(s.id)}>
                  Approve program
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteScholarship(s.id)}>
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
