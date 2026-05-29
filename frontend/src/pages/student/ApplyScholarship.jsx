import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KEYS, getItem } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { studentCanApplyForScholarship } from '../../utils/applicationHelpers';
import { readFileAsDataUrl } from '../../utils/fileUtils';

const ELIGIBILITY_TYPES = [
  { value: 'eligibility-transcript', label: 'Program-specific transcript' },
  { value: 'eligibility-proof', label: 'Eligibility proof (income, enrollment, etc.)' },
  { value: 'eligibility-other', label: 'Other eligibility document' },
];

export default function ApplyScholarship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getScholarships, getApplications, getFundRecords, addApplication, addDocument, tick } = useData();
  void tick;

  const scholarship = getScholarships().find((s) => s.id === id);
  const [essay, setEssay] = useState('');
  const [message, setMessage] = useState('');
  const [eligibilityDocs, setEligibilityDocs] = useState([]);
  const [docForm, setDocForm] = useState({ name: '', type: 'eligibility-proof', file: null });
  const [submitting, setSubmitting] = useState(false);

  if (!scholarship) {
    return (
      <div className="page">
        <p>Scholarship not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/student/browse')}>Back</button>
      </div>
    );
  }

  const applications = getApplications();
  const freshUser = getItem(KEYS.users, []).find((u) => u.id === user.id) || user;
  const existing = applications.find((a) => a.scholarshipId === id && a.studentId === user.id);
  const applyCheck = studentCanApplyForScholarship(freshUser, applications, getFundRecords());

  const addEligibilityDoc = async () => {
    setMessage('');
    if (!docForm.file) {
      setMessage('Select a file for the eligibility document.');
      return;
    }
    try {
      const { dataUrl, mimeType, fileName } = await readFileAsDataUrl(docForm.file);
      setEligibilityDocs((prev) => [
        ...prev,
        {
          name: docForm.name.trim() || fileName,
          type: docForm.type,
          fileName,
          fileData: dataUrl,
          mimeType,
        },
      ]);
      setDocForm({ name: '', type: 'eligibility-proof', file: null });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existing) {
      setMessage('You have already applied for this scholarship.');
      return;
    }
    if (!applyCheck.ok) {
      setMessage(applyCheck.reason);
      return;
    }
    if (eligibilityDocs.length === 0) {
      setMessage('Upload at least one eligibility document for this scholarship.');
      return;
    }

    setSubmitting(true);

    const applicationId = await addApplication({
      scholarshipId: scholarship.id,
      scholarshipTitle: scholarship.title,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      status: 'institution-review',
      institutionStatus: 'pending',
      forwardedToAdmin: false,
      essay,
      notes: '',
      remarks: [],
    });
    if (!applicationId) {
      setSubmitting(false);
      return;
    }
    eligibilityDocs.forEach((doc) => {
      addDocument({
        studentId: user.id,
        studentName: user.name,
        name: doc.name,
        type: doc.type,
        fileName: doc.fileName,
        fileData: doc.fileData,
        mimeType: doc.mimeType,
        applicationId,
        scholarshipId: scholarship.id,
      });
    });

    setSubmitting(false);
    navigate('/student/applications');
  };

  return (
    <div className="page">
      <h2 className="page-title">Apply for Scholarship</h2>
      <div className="card">
        <h3>{scholarship.title}</h3>
        <p>{scholarship.description}</p>
        <p><strong>Amount:</strong> ${scholarship.amount.toLocaleString()}</p>
        <p><strong>Deadline:</strong> {scholarship.deadline}</p>
      </div>

      {!applyCheck.ok && (
        <div className="alert alert-error">
          {applyCheck.reason}
          <p className="cell-muted" style={{ marginTop: '0.5rem' }}>
            You will be notified when administration allows you to apply again.
          </p>
        </div>
      )}

      {existing ? (
        <div className="alert alert-info">You already applied for this scholarship.</div>
      ) : applyCheck.ok ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          {message && <div className="alert alert-error">{message}</div>}

          <div className="form-group">
            <label htmlFor="essay">Personal Statement / Essay</label>
            <textarea
              id="essay"
              rows={6}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Tell us why you deserve this scholarship..."
              required
            />
          </div>

          <div className="card eligibility-docs-card">
            <h3 className="card-heading">Eligibility documents</h3>
            <p className="signup-section-desc">
              Upload proof required for this scholarship. Your institution will verify these before forwarding your application.
            </p>

            <div className="eligibility-upload-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Document label</label>
                  <input
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="e.g. Fall 2025 enrollment proof"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={docForm.type}
                    onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  >
                    {ELIGIBILITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>File (PDF, JPG, PNG — max 2 MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addEligibilityDoc}>
                Add document
              </button>
            </div>

            {eligibilityDocs.length > 0 && (
              <ul className="eligibility-doc-list">
                {eligibilityDocs.map((d, i) => (
                  <li key={i}>
                    {d.name} <span className="cell-muted">({d.type})</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setEligibilityDocs((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/browse')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
