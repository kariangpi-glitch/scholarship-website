import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';
import { filterApplicationsForAdmin } from '../../utils/applicationHelpers';

export default function AdminDashboard() {
  const { getScholarships, getApplications, tick } = useData();
  void tick;

  const scholarships = getScholarships();
  const adminApps = filterApplicationsForAdmin(getApplications());
  const active = scholarships.filter((s) => s.status === 'active').length;
  const pending = adminApps.filter((a) => a.status === 'pending').length;
  const approved = adminApps.filter((a) => a.status === 'approved').length;

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Administrator Dashboard</h2>
        <p className="page-subtitle">Overview of scholarship programs and forwarded applications</p>
      </div>
      <div className="stats-grid">
        <StatCard title="Active programs" value={active} icon="🎓" color="blue" />
        <StatCard title="Pending decisions" value={pending} icon="📥" color="orange" />
        <StatCard title="Approved awards" value={approved} icon="✅" color="green" />
      </div>
    </div>
  );
}
