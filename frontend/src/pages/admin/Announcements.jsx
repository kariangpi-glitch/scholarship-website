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
