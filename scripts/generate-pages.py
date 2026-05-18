#!/usr/bin/env python3
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
D = 'motion.div'  # will be fixed below - NO use div only

def tag(name, attrs='', close=False, self_close=False):
    a = f' {attrs}' if attrs else ''
    if self_close:
        return f'<{name}{a} />'
    if close:
        return f'</{name}>'
    return f'<{name}{a}>'

# Use div only
D = 'div'

def w(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

# Fix any accidental motion in content
def clean(s):
    return s.replace('motion.div', D)

w('src/pages/admin/AdminApplications.jsx', clean('''
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function AdminApplications() {
  const { getApplications, updateApplication, tick } = useData();
  void tick;
  const apps = getApplications();

  const handle = (id, status) => updateApplication(id, { status });

  return (
    <div className="page">
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
'''))

w('src/pages/admin/Announcements.jsx', clean('''
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
    <div className="page">
      <h2 className="page-title">Announcements</h2>
      <form className="card form-card" onSubmit={handleSubmit}>
        <h3>Post Announcement</h3>
        <motion.div className="form-group">
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
'''))

w('src/pages/admin/AdminProfile.jsx', clean('''
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
  };

  return (
    <div className="page">
      <h2 className="page-title">Admin Profile</h2>
      <form className="card form-card" onSubmit={handleSubmit}>
        {saved && <div className="alert alert-success">Profile updated!</div>}
        <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
'''))

print('Admin pages done')
