import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  student: 'Student',
  admin: 'Administrator',
  institution: 'Institution',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

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
        <span className="navbar__role">{ROLE_LABELS[user?.role] || user?.role}</span>
        <span className="navbar__user">{user?.name}</span>
        <button type="button" className="btn btn-outline-light" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
