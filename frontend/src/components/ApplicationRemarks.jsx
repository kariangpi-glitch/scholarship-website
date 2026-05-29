import { useState } from 'react';
import { getApplicationRemarks } from '../utils/applicationHelpers';

const REMARK_TEMPLATES = [
  'Please upload additional eligibility documents for this scholarship application.',
  'Please upload or update your general documents on the Documents page.',
  'Your passport or photo ID needs to be uploaded or re-submitted for verification.',
  'Please provide a clearer copy of your academic transcript.',
];

export default function ApplicationRemarks({ application, canPost = false, onAddRemark, showStudentHint = false }) {
  const [text, setText] = useState('');
  const remarks = getApplicationRemarks(application);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !onAddRemark) return;
    onAddRemark(trimmed);
    setText('');
  };

  const applyTemplate = (template) => {
    setText(template);
  };

  return (
    <div className="app-remarks">
      <h4 className="app-remarks__title">Application remarks</h4>
      <p className="app-remarks__hint">
        {canPost
          ? 'Send a remark to the student about this application (e.g. request more documents).'
          : showStudentHint
            ? 'Read the remarks below, then upload or replace documents in the section underneath.'
            : null}
      </p>
      {remarks.length === 0 ? (
        <p className="app-remarks__empty">No remarks sent yet.</p>
      ) : (
        <ul className="app-remarks__list">
          {remarks.map((r) => (
            <li key={r.id} className="app-remarks__item">
              <div className="app-remarks__meta">
                <strong>{r.authorName}</strong>
                <span className="app-remarks__role">Institution</span>
                <time className="app-remarks__time">
                  {new Date(r.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="app-remarks__text">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
      {canPost && (
        <form className="app-remarks__form" onSubmit={handleSubmit}>
          <div className="app-remarks__templates">
            <span className="app-remarks__templates-label">Quick remarks:</span>
            {REMARK_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                className="btn btn-sm btn-secondary app-remarks__template-btn"
                onClick={() => applyTemplate(t)}
              >
                {t.length > 48 ? `${t.slice(0, 48)}…` : t}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Please upload your latest transcript and proof of enrollment for this scholarship."
            required
          />
          <button type="submit" className="btn btn-sm btn-primary">
            Send remark to student
          </button>
        </form>
      )}
    </div>
  );
}
