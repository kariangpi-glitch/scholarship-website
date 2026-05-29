import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

const EMPTY = {
  title: '',
  description: '',
  amount: '',
  deadline: '',
  eligibility: '',
  category: 'Merit',
  institutionName: 'ScholarshipHub',
};

export default function ManageScholarships() {
  const { user } = useAuth();
  const { getScholarships, addScholarship, updateScholarship, deleteScholarship, tick } = useData();
  void tick;

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const scholarships = getScholarships();

  const openCreate = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      title: s.title,
      description: s.description,
      amount: String(s.amount),
      deadline: s.deadline,
      eligibility: s.eligibility,
      category: s.category,
      institutionName: s.institutionName,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      createdBy: user.id,
      institutionId: null,
    };
    if (editingId) {
      updateScholarship(editingId, payload);
    } else {
      addScholarship(payload);
    }
    setShowForm(false);
    setForm(EMPTY);
    setEditingId(null);
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Manage Scholarships</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Create Scholarship
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit' : 'Create'} Scholarship</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount ($)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Eligibility</label>
            <input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      )}

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scholarships.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>${s.amount.toLocaleString()}</td>
                <td>{s.deadline}</td>
                <td><StatusBadge status={s.status} /></td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>Edit</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteScholarship(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
