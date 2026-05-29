import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KEYS, getItem } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import { isScholarshipVisible } from '../../utils/scholarshipHelpers';
import { studentCanApplyForScholarship } from '../../utils/applicationHelpers';

export default function BrowseScholarships() {
  const { user } = useAuth();
  const { getScholarships, getApplications, getFundRecords, tick } = useData();
  void tick;

  const freshUser = getItem(KEYS.users, []).find((u) => u.id === user.id) || user;
  const applyCheck = studentCanApplyForScholarship(freshUser, getApplications(), getFundRecords());
  const [search, setSearch] = useState('');
  const scholarships = getScholarships().filter(isScholarshipVisible);

  const filtered = scholarships.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h2 className="page-title">Browse Scholarships</h2>
      {!applyCheck.ok && (
        <div className="alert alert-error">{applyCheck.reason}</div>
      )}
      <input
        type="search"
        className="search-input"
        placeholder="Search scholarships..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="cards-grid">
        {filtered.map((s) => (
          <div key={s.id} className="scholarship-card">
            <div className="scholarship-card__header">
              <h3>{s.title}</h3>
              <StatusBadge status="active" />
            </div>
            <p className="scholarship-card__desc">{s.description}</p>
            <div className="scholarship-card__meta">
              <span>💰 ${s.amount.toLocaleString()}</span>
              <span>📅 Deadline: {s.deadline}</span>
              <span>🏷️ {s.category}</span>
              <span>🏛️ {s.institutionName}</span>
            </div>
            <p className="scholarship-card__elig"><strong>Eligibility:</strong> {s.eligibility}</p>
            <Link to={`/student/apply/${s.id}`} className="btn btn-primary">
              Apply Now
            </Link>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty-text">No scholarships found.</p>}
    </div>
  );
}
