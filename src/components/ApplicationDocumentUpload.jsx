import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatusBadge from './StatusBadge';
import { readFileAsDataUrl } from '../utils/fileUtils';
import {
  getApplicationDocuments,
  getApplicationRemarks,
  getStudentGeneralDocuments,
} from '../utils/applicationHelpers';

const ELIGIBILITY_TYPES = [
  { value: 'eligibility-transcript', label: 'Program transcript' },
  { value: 'eligibility-proof', label: 'Eligibility proof' },
  { value: 'eligibility-other', label: 'Other eligibility document' },
];

const GENERAL_TYPES = [
  { value: 'transcript', label: 'Academic transcript' },
  { value: 'recommendation', label: 'Recommendation letter' },
  { value: 'identity-passport', label: 'Passport / photo ID' },
  { value: 'other', label: 'Other supporting document' },
];

export default function ApplicationDocumentUpload({ application }) {
  const { user } = useAuth();
  const { getDocuments, addDocument, updateDocument, tick } = useData();
  void tick;

  const [uploadKind, setUploadKind] = useState('eligibility');
  const [name, setName] = useState('');
  const [type, setType] = useState('eligibility-proof');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replacingId, setReplacingId] = useState(null);

  const allDocs = getDocuments();
  const appDocs = getApplicationDocuments(allDocs, application.id);
  const generalDocs = getStudentGeneralDocuments(allDocs, user.id);
  const remarks = getApplicationRemarks(application);

  const showUpload = application.documentUploadRequested || remarks.length > 0;
  if (!showUpload) return null;

  const types = uploadKind === 'eligibility' ? ELIGIBILITY_TYPES : GENERAL_TYPES;

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file && !replacingId) {
      setError('Please select a file.');
      return;
    }
    if (!file && replacingId) {
      setError('Select a new file to replace this document.');
      return;
    }
    try {
      const { dataUrl, mimeType, fileName } = await readFileAsDataUrl(file);
      const payload = {
        studentId: user.id,
        studentName: user.name,
        name: name.trim() || fileName,
        type,
        fileName,
        fileData: dataUrl,
        mimeType,
      };

      if (uploadKind === 'eligibility') {
        payload.applicationId = application.id;
        payload.scholarshipId = application.scholarshipId;
      }

      if (replacingId) {
        updateDocument(replacingId, {
          ...payload,
          verified: false,
          verifiedBy: null,
          uploadedAt: new Date().toISOString().split('T')[0],
        });
        setReplacingId(null);
        setSuccess('Document replaced. Your institution will verify it again.');
      } else {
        addDocument(payload);
        setSuccess(
          uploadKind === 'eligibility'
            ? 'Eligibility document uploaded for this application.'
            : 'General document uploaded. Your institution will verify it.'
        );
      }

      setName('');
      setFile(null);
      setType(uploadKind === 'eligibility' ? 'eligibility-proof' : 'transcript');
    } catch (err) {
      setError(err.message);
    }
  };

  const startReplace = (doc) => {
    setReplacingId(doc.id);
    setUploadKind(doc.applicationId ? 'eligibility' : 'general');
    setName(doc.name);
    setType(doc.type);
    setFile(null);
    setSuccess('');
    setError('');
  };

  const cancelReplace = () => {
    setReplacingId(null);
    setName('');
    setFile(null);
  };

  return (
    <div className="app-doc-upload">
      <h4 className="app-doc-upload__title">Upload documents</h4>
      {application.documentUploadRequested && (
        <p className="alert alert-info app-doc-upload__alert">
          Your institution requested new or corrected documents. Upload or replace files below.
        </p>
      )}

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {appDocs.length > 0 && (
        <div className="app-doc-upload__section">
          <p className="app-doc-upload__label">Eligibility documents for this scholarship</p>
          <ul className="app-doc-upload__list">
            {appDocs.map((d) => (
              <li key={d.id}>
                <span>{d.name}</span>
                <StatusBadge status={d.verified ? 'approved' : 'pending'} />
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => startReplace(d)}>
                  Replace
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="app-doc-upload__form" onSubmit={handleUpload}>
        <div className="app-doc-upload__kind">
          <label>
            <input
              type="radio"
              name={`kind-${application.id}`}
              checked={uploadKind === 'eligibility'}
              onChange={() => {
                setUploadKind('eligibility');
                setType('eligibility-proof');
                cancelReplace();
              }}
            />
            Eligibility document (this scholarship)
          </label>
          <label>
            <input
              type="radio"
              name={`kind-${application.id}`}
              checked={uploadKind === 'general'}
              onChange={() => {
                setUploadKind('general');
                setType('transcript');
                cancelReplace();
              }}
            />
            General document (all applications)
          </label>
        </div>

        {replacingId && (
          <p className="app-doc-upload__replacing">Replacing: {name}. Select a new file below.</p>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Label</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((t) => (
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-sm btn-primary">
            {replacingId ? 'Replace document' : 'Upload new document'}
          </button>
          {replacingId && (
            <button type="button" className="btn btn-sm btn-secondary" onClick={cancelReplace}>
              Cancel replace
            </button>
          )}
        </div>
      </form>

      {uploadKind === 'general' && generalDocs.length > 0 && (
        <div className="app-doc-upload__section">
          <p className="app-doc-upload__label">Your general documents</p>
          <ul className="app-doc-upload__list">
            {generalDocs.map((d) => (
              <li key={d.id}>
                <span>{d.name}</span>
                <StatusBadge status={d.verified ? 'approved' : 'pending'} />
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => startReplace(d)}>
                  Replace
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
