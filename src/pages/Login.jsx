import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'student', label: 'Student', icon: '👨‍🎓', desc: 'Apply for scholarships' },
  { id: 'institution', label: 'Department', icon: '🏛️', desc: 'Verify & forward applications' },
  { id: 'admin', label: 'Administrator', icon: '👩‍💼', desc: 'Manage programs & decisions' },
];

const DEMO = {
  student: { email: 'student@gmail.com', password: '1234' },
  admin: { email: 'admin@gmail.com', password: '1234' },
  institution: { email: 'institution@gmail.com', password: '1234' },
};

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('student@gmail.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (r) => {
    setRole(r);
    setEmail(DEMO[r].email);
    setPassword(DEMO[r].password);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password, role);
    if (result.success) {
      navigate(result.pending ? '/pending-verification' : `/${role}`);
    } else {
      setError('The email, password, or role you selected is incorrect. Please try again.');
    }
  };

  const roleLabel = ROLES.find((r) => r.id === role)?.label || role;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🎓</span>
          <h1>ScholarshipHub</h1>
          <p>Scholarship &amp; Financial Aid Management Platform</p>
        </div>

        <p className="login-subtitle">Select your account type and sign in to continue</p>

        <div className="role-selector">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`role-btn ${role === r.id ? 'role-btn--active' : ''}`}
              onClick={() => handleRoleChange(r.id)}
            >
              <span className="role-btn__icon">{r.icon}</span>
              <span className="role-btn__label">{r.label}</span>
              <span className="role-btn__desc">{r.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Sign in as {roleLabel}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/signup">Create an account</Link>
        </p>

        <div className="demo-hint">
          <p className="demo-hint__title">Demonstration accounts</p>
          <p>Student — student@gmail.com / 1234</p>
          <p>Department — institution@gmail.com / 1234</p>
          <p>Administrator — admin@gmail.com / 1234</p>
        </div>
      </div>
    </div>
  );
}
