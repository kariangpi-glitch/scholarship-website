import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import {
  getLiveInstitutionPrograms,
  getPendingInstitutionPrograms,
} from '../../utils/scholarshipHelpers';

export default function InstScholarships() {
  const { user } = useAuth();
  const { getScholarships, getApplications, addScholarship, updateScholarship, deleteScholarship, tick } = useData();
  void tick;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    eligibility: '',
    category: 'General',
  });
  const [editId, setEditId] = useState(null);

  const allScholarships = getScholarships();
  const published = getLiveInstitutionPrograms(allScholarships, user.id);
  const pending = getPendingInstitutionPrograms(allScholarships, user.id);
  const applications = getApplications();

  const appCount = (schId) =>
    applications.filter((a) => a.scholarshipId === schId && a.status !== 'withdrawn').length;

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      institutionId: user.id,
      institutionName: user.name,
      createdBy: user.id,
    };
    if (editId) updateScholarship(editId, payload);
    else addScholarship(payload, { institutionRequest: true });
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', description: '', amount: '', deadline: '', eligibility: '', category: 'General' });
  };

  const renderCard = (s, showLive) => (
    <article key={s.id} className="scholarship-card">
      <div className="scholarship-card__header">
        <h3>{s.title}</h3>
        {showLive ? (
          <StatusBadge status="active" label="Live — open to students" />
        ) : (
          <StatusBadge status="pending-approval" />
        )}
      </div>
      <p className="scholarship-card__desc">{s.description}</p>
      <p className="scholarship-card__meta">
        <span>${Number(s.amount).toLocaleString()}</span>
        <span>Deadline: {s.deadline}</span>
        {showLive && <span>{appCount(s.id)} application(s)</span>}
      </p>
      <p className="scholarship-card__elig"><strong>Eligibility:</strong> {s.eligibility}</p>
      {showLive ? (
        <p className="cell-muted">Visible to students in Browse Programs.</p>
      ) : (
        <p className="cell-muted">Awaiting administrator approval before students can apply.</p>
      )}
      {s.approvalStatus !== 'pending' && (
        <div className="actions-cell">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setEditId(s.id);
              setForm({
                title: s.title,
                description: s.description,
                amount: String(s.amount),
                deadline: s.deadline,
                eligibility: s.eligibility,
                category: s.category || 'General',
              });
              setShowForm(true);
            }}
          >
            Edit
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteScholarship(s.id)}>
            Remove
          </button>
        </div>
      )}
    </article>
  );

  return (
    <div className="page">
      <div className="page-header-row">
        <div className="page-intro" style={{ marginBottom: 0 }}>
          <h2 className="page-title">Our programs</h2>
          <p className="page-subtitle">
            All active and approved programs linked to your institution. Request new ones for admin approval.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Request new program
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={submit}>
          <h3 className="card-heading">{editId ? 'Edit program' : 'Request new program'}</h3>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Amount ($)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="form-group"><label>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required /></div>
          </div>
          <div className="form-group"><label>Eligibility</label><input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} required /></div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Save' : 'Submit request'}</button>
          </div>
        </form>
      )}

      <section className="programs-section">
        <h3 className="card-heading">Active programs ({published.length})</h3>
        {published.length === 0 ? (
          <div className="card empty-state">
            <p className="empty-text">No active programs yet. Submit a request and wait for admin approval.</p>
          </div>
        ) : (
          <div className="programs-list">{published.map((s) => renderCard(s, true))}</div>
        )}
      </section>

      {pending.length > 0 && (
        <section className="programs-section">
          <h3 className="card-heading">Pending admin approval ({pending.length})</h3>
          <div className="programs-list">{pending.map((s) => renderCard(s, false))}</div>
        </section>
      )}
    </div>
  );
}
