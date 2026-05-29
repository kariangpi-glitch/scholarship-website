import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const ROLE_LABELS = {
  student: 'Student',
  admin: 'Administrator',
  institution: 'Institution',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { getUnreadNotificationCount, tick } = useData();
  void tick;
  const unread = user?.role === 'student' ? getUnreadNotificationCount(user.id) : 0;

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button type="button" className="navbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          ☰
        </button>
        <div className="navbar__brand">
          <span className="navbar__logo">🎓</span>
          <div>
            <h1>ScholarshipHub</h1>
            <p>Scholarship &amp; Financial Aid Management</p>
          </div>
        </div>
      </div>
      <div className="navbar__right">
        {user?.role === 'student' && (
          <Link to="/student/notifications" className="navbar__notifications">
            🔔 Notifications
            {unread > 0 && <span className="navbar__badge">{unread}</span>}
          </Link>
        )}
        <span className="navbar__role">{ROLE_LABELS[user?.role] || user?.role}</span>
        <span className="navbar__user">{user?.name}</span>
        <button type="button" className="btn btn-outline-light" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
