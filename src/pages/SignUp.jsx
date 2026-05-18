import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { readFileAsDataUrl } from '../utils/fileUtils';

const ROLES = [
  { id: 'student', label: 'Student', icon: '👨‍🎓' },
  { id: 'admin', label: 'Administrator', icon: '👩‍💼' },
  { id: 'institution', label: 'Institution', icon: '🏛️' },
];

const EMPTY = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  university: '',
  major: '',
  gpa: '',
  dateOfBirth: '',
  studentId: '',
  department: '',
  organization: '',
  address: '',
  contactPerson: '',
  idProofFileName: '',
  idProofFileData: '',
  idProofMimeType: '',
  idProofNotes: '',
};

export default function SignUp() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [idProofFile, setIdProofFile] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'student') {
      if (!form.name || !form.university || !form.major) {
        setError('Please complete all required profile fields.');
        return;
      }
    }

    if (role === 'admin' || role === 'institution') {
      if (!idProofFile) {
        setError('Please upload your ID proof document.');
        return;
      }
      if (role === 'institution' && (!form.contactPerson || !form.address)) {
        setError('Institution contact person and address are required.');
        return;
      }
    }

    let payload = { ...form, email: form.email, role };
    if (idProofFile) {
      try {
        const { dataUrl, mimeType, fileName } = await readFileAsDataUrl(idProofFile);
        payload = { ...payload, idProofFileName: fileName, idProofFileData: dataUrl, idProofMimeType: mimeType };
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const result = register(payload);
    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.pending) {
      navigate('/pending-verification');
    } else {
      navigate(`/${role}`);
    }
  };

  const roleLabel = ROLES.find((r) => r.id === role)?.label;

  return (
    <div className="login-page">
      <div className="login-card login-card--wide">
        <div className="login-header">
          <span className="login-logo">🎓</span>
          <h1>Create an account</h1>
          <p>Join ScholarshipHub to manage or apply for financial aid programs</p>
        </div>

        <div className="role-selector">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`role-btn ${role === r.id ? 'role-btn--active' : ''}`}
              onClick={() => {
                setRole(r.id);
                setError('');
              }}
            >
              <span className="role-btn__icon">{r.icon}</span>
              <span className="role-btn__label">{r.label}</span>
            </button>
          ))}
        </div>

        {role !== 'student' && (
          <div className="alert alert-info signup-notice">
            {role === 'admin'
              ? 'Administrator accounts require identity verification before access is granted.'
              : 'Institution accounts must submit proof of affiliation. An administrator will review your documents.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="alert alert-error">{error}</div>}

          <h3 className="signup-section-title">Account credentials</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email address *</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone number *</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password *</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>

          {role === 'student' && (
            <>
              <h3 className="signup-section-title">Student profile</h3>
              <p className="signup-section-desc">
                This information is required before you can access your dashboard and apply for scholarships.
              </p>
              <div className="form-group">
                <label htmlFor="name">Full legal name *</label>
                <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="university">University / college *</label>
                  <input
                    id="university"
                    value={form.university}
                    onChange={(e) => set('university', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="major">Field of study *</label>
                  <input id="major" value={form.major} onChange={(e) => set('major', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gpa">Current GPA *</label>
                  <input id="gpa" value={form.gpa} onChange={(e) => set('gpa', e.target.value)} placeholder="e.g. 3.75" required />
                </div>
                <div className="form-group">
                  <label htmlFor="studentId">Student ID (optional)</label>
                  <input id="studentId" value={form.studentId} onChange={(e) => set('studentId', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of birth (optional)</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              <h3 className="signup-section-title">Administrator details</h3>
              <div className="form-group">
                <label htmlFor="name">Full name *</label>
                <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <input id="department" value={form.department} onChange={(e) => set('department', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="organization">Organization *</label>
                  <input id="organization" value={form.organization} onChange={(e) => set('organization', e.target.value)} required />
                </div>
              </div>
            </>
          )}

          {role === 'institution' && (
            <>
              <h3 className="signup-section-title">Institution details</h3>
              <div className="form-group">
                <label htmlFor="name">Institution name *</label>
                <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact person *</label>
                  <input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => set('contactPerson', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Official address *</label>
                  <input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} required />
                </div>
              </div>
            </>
          )}

          {(role === 'admin' || role === 'institution') && (
            <>
              <h3 className="signup-section-title">Identity verification</h3>
              <p className="signup-section-desc">
                Upload a document that confirms your authority to act as a {role === 'admin' ? 'platform administrator' : 'registered institution'}.
              </p>
              <div className="form-group">
                <label htmlFor="idProofFile">Upload ID proof *</label>
                <input
                  id="idProofFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                  required
                />
                {idProofFile && <p className="file-selected">Selected: {idProofFile.name}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="idProofNotes">Additional notes (optional)</label>
                <textarea
                  id="idProofNotes"
                  rows={2}
                  value={form.idProofNotes}
                  onChange={(e) => set('idProofNotes', e.target.value)}
                  placeholder="Reference number, issuing authority, etc."
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block">
            {role === 'student' ? 'Create account & go to dashboard' : `Register as ${roleLabel}`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
