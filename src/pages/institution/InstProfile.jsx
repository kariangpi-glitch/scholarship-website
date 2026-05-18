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
    <div className="page">
      <h2 className="page-title">Institution Profile</h2>
      <form className="card form-card" onSubmit={(e) => { e.preventDefault(); updateProfile(form); setSaved(true); }}>
        {saved && <div className="alert alert-success">Profile updated!</div>}
        <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
        <div className="form-group"><label>Institution Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
