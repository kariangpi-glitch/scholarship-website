#!/usr/bin/env python3
"""Generate remaining ScholarshipHub source files."""
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')

def w(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    text = content.strip() + '\n'
    text = text.replace('motion.div', 'div')
    with open(path, 'w') as f:
        f.write(text)

w('src/pages/admin/ManageScholarships.jsx', open(os.path.join(ROOT, 'src/pages/admin/ManageScholarships.jsx')).read() if False else '')

w('src/pages/admin/AdminApplications.jsx', '''
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function AdminApplications() {
  const { getApplications, updateApplication, tick } = useData();
  void tick;
  const apps = getApplications();
  const handle = (id, status) => updateApplication(id, { status });

  return (
    <motion.div className="page">
      <h2 className="page-title">All Applications</h2>
      <p className="page-subtitle">Review and approve or reject applications</p>
      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Scholarship</th><th>Applied</th><th>Institution</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.studentName}<br /><small>{a.studentEmail}</small></td>
                <td>{a.scholarshipTitle}</td>
                <td>{a.appliedAt}</td>
                <td><StatusBadge status={a.institutionStatus === 'verified' ? 'verified' : 'pending'} /></td>
                <td><StatusBadge status={a.status} /></td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => handle(a.id, 'approved')}>Approve</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handle(a.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
''')

w('src/pages/admin/Announcements.jsx', '''
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function Announcements() {
  const { user } = useAuth();
  const { getAnnouncements, addAnnouncement, deleteAnnouncement, tick } = useData();
  void tick;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const list = getAnnouncements();

  const handleSubmit = (e) => {
    e.preventDefault();
    addAnnouncement({ title, content, createdBy: user.id });
    setTitle('');
    setContent('');
  };

  return (
    <motion.div className="page">
      <h2 className="page-title">Announcements</h2>
      <form className="card form-card" onSubmit={handleSubmit}>
        <h3>Post Announcement</h3>
        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
        </div>
        <button type="submit" className="btn btn-primary">Post</button>
      </form>
      <div className="card">
        <h3>All Announcements</h3>
        <ul className="announcement-list">
          {list.map((a) => (
            <li key={a.id}>
              <strong>{a.title}</strong>
              <p>{a.content}</p>
              <small>{a.createdAt}</small>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteAnnouncement(a.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
''')

w('src/pages/admin/AdminProfile.jsx', '''
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [saved, setSaved] = useState(false);

  return (
    <motion.div className="page">
      <h2 className="page-title">Admin Profile</h2>
      <form className="card form-card" onSubmit={(e) => { e.preventDefault(); updateProfile(form); setSaved(true); }}>
        {saved && <div className="alert alert-success">Profile updated!</div>}
        <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></motion.div>
        <div className="form-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
''')

w('src/pages/institution/InstDashboard.jsx', '''
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';

export default function InstDashboard() {
  const { user } = useAuth();
  const { getScholarships, getApplications, getDocuments, tick } = useData();
  void tick;
  const scholarships = getScholarships().filter((s) => s.institutionId === user.id);
  const apps = getApplications();
  const docs = getDocuments().filter((d) => !d.verified);

  return (
    <motion.div className="page">
      <h2 className="page-title">Institution Dashboard</h2>
      <p className="page-subtitle">Welcome, {user.name}</p>
      <div className="stats-grid">
        <StatCard title="Our Scholarships" value={scholarships.length} icon="🎓" color="blue" />
        <StatCard title="Applications" value={apps.length} icon="📋" color="orange" />
        <StatCard title="Docs to Verify" value={docs.length} icon="📄" color="green" />
      </div>
    </div>
  );
}
''')

w('src/pages/institution/InstApplications.jsx', '''
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function InstApplications() {
  const { user } = useAuth();
  const { getApplications, getScholarships, updateApplication, tick } = useData();
  void tick;
  const instSchIds = getScholarships().filter((s) => s.institutionId === user.id).map((s) => s.id);
  const apps = getApplications().filter((a) => instSchIds.includes(a.scholarshipId) || a.status === 'institution-review');

  const verifyAndForward = (id) => {
    updateApplication(id, { institutionStatus: 'verified', status: 'pending' });
  };

  return (
    <motion.div className="page">
      <h2 className="page-title">Scholarship Applications</h2>
      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Scholarship</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.studentName}</td>
                <td>{a.scholarshipTitle}</td>
                <td>{a.appliedAt}</td>
                <td><StatusBadge status={a.status} /></td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => verifyAndForward(a.id)}>
                    Verify & Send to Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
''')

w('src/pages/institution/VerifyDocuments.jsx', '''
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function VerifyDocuments() {
  const { getDocuments, updateDocument, tick } = useData();
  void tick;
  const docs = getDocuments();

  const verify = (id) => updateDocument(id, { verified: true, verifiedBy: 'institution' });

  return (
    <motion.div className="page">
      <h2 className="page-title">Verify Student Documents</h2>
      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Document</th><th>Type</th><th>Uploaded</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{d.studentName}</td>
                <td>{d.name}</td>
                <td>{d.type}</td>
                <td>{d.uploadedAt}</td>
                <td><StatusBadge status={d.verified ? 'approved' : 'pending'} /></td>
                <td>
                  {!d.verified && (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => verify(d.id)}>Verify</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
''')

w('src/pages/institution/InstScholarships.jsx', '''
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function InstScholarships() {
  const { user } = useAuth();
  const { getScholarships, addScholarship, updateScholarship, deleteScholarship, tick } = useData();
  void tick;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '', deadline: '', eligibility: '', category: 'General' });
  const [editId, setEditId] = useState(null);

  const list = getScholarships().filter((s) => s.institutionId === user.id);

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
    else addScholarship(payload);
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', description: '', amount: '', deadline: '', eligibility: '', category: 'General' });
  };

  return (
    <motion.div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Institution Scholarships</h2>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Scholarship</button>
      </div>
      {showForm && (
        <form className="card form-card" onSubmit={submit}>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Amount</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="form-group"><label>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required /></div>
          </div>
          <div className="form-group"><label>Eligibility</label><input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} required /></div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      )}
      <div className="cards-grid">
        {list.map((s) => (
          <div key={s.id} className="scholarship-card">
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <p>${s.amount.toLocaleString()} · {s.deadline}</p>
            <StatusBadge status={s.status} />
            <div className="actions-cell">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditId(s.id); setForm({ title: s.title, description: s.description, amount: String(s.amount), deadline: s.deadline, eligibility: s.eligibility, category: s.category }); setShowForm(true); }}>Edit</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteScholarship(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
''')

w('src/pages/institution/InstProfile.jsx', '''
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function InstProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    contactPerson: user?.contactPerson || '',
  });
  const [saved, setSaved] = useState(false);

  return (
    <motion.div className="page">
      <h2 className="page-title">Institution Profile</h2>
      <form className="card form-card" onSubmit={(e) => { e.preventDefault(); updateProfile(form); setSaved(true); }}>
        {saved && <div className="alert alert-success">Profile updated!</div>}
        <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
        <div className="form-group"><label>Institution Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
''')

w('src/components/ProtectedRoute.jsx', '''
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}
''')

w('src/config/menus.js', '''
export const studentMenu = [
  { path: '/student', label: 'Dashboard', icon: '📊', end: true },
  { path: '/student/browse', label: 'Browse Scholarships', icon: '🔍' },
  { path: '/student/documents', label: 'Upload Documents', icon: '📄' },
  { path: '/student/applications', label: 'My Applications', icon: '📋' },
  { path: '/student/profile', label: 'Profile', icon: '👤' },
];

export const adminMenu = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/scholarships', label: 'Manage Scholarships', icon: '🎓' },
  { path: '/admin/applications', label: 'Applications', icon: '📥' },
  { path: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { path: '/admin/profile', label: 'Profile', icon: '👤' },
];

export const institutionMenu = [
  { path: '/institution', label: 'Dashboard', icon: '📊', end: true },
  { path: '/institution/applications', label: 'Applications', icon: '📋' },
  { path: '/institution/documents', label: 'Verify Documents', icon: '✅' },
  { path: '/institution/scholarships', label: 'Our Scholarships', icon: '🎓' },
  { path: '/institution/profile', label: 'Profile', icon: '👤' },
];
''')

print('Generated pages')
