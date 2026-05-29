import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { getApplications, getAnnouncements, getNotifications, getUnreadNotificationCount, tick } = useData();
  void tick;

  const apps = getApplications().filter((a) => a.studentId === user.id);
  const total = apps.length;
  const pending = apps.filter((a) => a.status === 'pending' || a.status === 'institution-review').length;
  const approved = apps.filter((a) => a.status === 'approved').length;
  const unread = getUnreadNotificationCount(user.id);
  const announcements = getAnnouncements().slice(0, 3);
  const recentNotifications = getNotifications()
    .filter((n) => n.userId === user.id)
    .slice(0, 5);

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Student Dashboard</h2>
        <p className="page-subtitle">Welcome back, {user.name}. Track your applications and program updates below.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Total applications" value={total} icon="📋" color="blue" />
        <StatCard title="In progress" value={pending} icon="⏳" color="orange" />
        <StatCard title="Approved awards" value={approved} icon="✅" color="green" />
        <StatCard title="Unread notifications" value={unread} icon="🔔" color="orange" />
      </div>

      {unread > 0 && (
        <div className="alert alert-info">
          You have {unread} unread notification{unread !== 1 ? 's' : ''}.{' '}
          <Link to="/student/notifications">View all notifications</Link>
        </div>
      )}

      <div className="card">
        <div className="card-heading-row">
          <h3 className="card-heading">Recent updates</h3>
          <Link to="/student/notifications" className="card-heading-link">
            View all
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <p className="empty-text">No updates yet. You will be notified when your institution or admin acts on your application.</p>
        ) : (
          <ul className="notification-list notification-list--compact">
            {recentNotifications.map((n) => (
              <li key={n.id} className={`notification-item ${n.read ? '' : 'notification-item--unread'}`}>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="card-heading">Recent announcements</h3>
        {announcements.length === 0 ? (
          <p className="empty-text">No announcements at this time.</p>
        ) : (
          <ul className="announcement-list">
            {announcements.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>
                <p>{a.content}</p>
                <small>{a.createdAt}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
