import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';
import { getLiveInstitutionPrograms } from '../../utils/scholarshipHelpers';

export default function InstDashboard() {
  const { user } = useAuth();
  const { getScholarships, getApplications, getDocuments, tick } = useData();
  void tick;

  const scholarships = getLiveInstitutionPrograms(getScholarships(), user.id);
  const instSchIds = scholarships.map((s) => s.id);
  const apps = getApplications().filter(
    (a) => instSchIds.includes(a.scholarshipId) || a.status === 'institution-review'
  );
  const pendingDocs = getDocuments().filter((d) => {
    const app = apps.find((a) => a.studentId === d.studentId);
    return app && !d.verified;
  }).length;

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Institution Dashboard</h2>
        <p className="page-subtitle">Welcome, {user.name}. Manage programs and review applicant submissions.</p>
      </div>
      <div className="stats-grid">
        <StatCard title="Active programs" value={scholarships.length} icon="🎓" color="blue" />
        <StatCard title="Applications" value={apps.length} icon="📋" color="orange" />
        <StatCard title="Documents pending" value={pendingDocs} icon="📄" color="green" />
      </div>
    </div>
  );
}
