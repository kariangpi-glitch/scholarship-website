import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [saved, setSaved] = useState(false);

  return (
    <div className="page">
      <h2 className="page-title">Admin Profile</h2>
      <form className="card form-card" onSubmit={(e) => { e.preventDefault(); updateProfile(form); setSaved(true); }}>
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
