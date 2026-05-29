import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewer from '../../components/DocumentViewer';
import BankDetailsForm from '../../components/BankDetailsForm';
import { readFileAsDataUrl } from '../../utils/fileUtils';

const DOC_TYPES = [
  { value: 'transcript', label: 'Academic transcript' },
  { value: 'recommendation', label: 'Recommendation letter' },
  { value: 'identity-passport', label: 'Passport / photo ID (anti-fraud)' },
  { value: 'other', label: 'Other supporting document' },
];

export default function StudentDocuments() {
  const { user, updateProfile } = useAuth();

  const {
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    tick,
  } = useData();

  void tick;

  const [name, setName] = useState('');
  const [type, setType] = useState('transcript');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [viewDoc, setViewDoc] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    type: 'transcript',
  });

  const [editFile, setEditFile] = useState(null);

  const allDocuments = getDocuments();

const allMine = Array.isArray(allDocuments)
  ? allDocuments.filter((d) => d.studentId === user.id)
  : [];

  const docs = allMine.filter((d) => !d.applicationId);

  const appDocs = allMine.filter((d) => d.applicationId);

  const hasIdentity = docs.some(
    (d) => d.type === 'identity-passport'
  );

  const handleUpload = async (e) => {
    e.preventDefault();

    setError('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      const { dataUrl, mimeType, fileName } =
        await readFileAsDataUrl(file);

      const saved = await addDocument({
        studentId: user.id,
        studentName: user.name,
        name: name.trim() || fileName,
        type,
        fileName,
        fileData: dataUrl,
        mimeType,
      });
      if (!saved) {
        setError('Document upload failed.');
        return;
      }

      setName('');
      setType('transcript');
      setFile(null);

      e.target.reset?.();

    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (d) => {
    setEditingId(d.id);

    setEditForm({
      name: d.name,
      type: d.type,
    });

    setEditFile(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    setError('');

    const updates = {
      name: editForm.name.trim(),
      type: editForm.type,
      verified: false,
      verifiedBy: null,
    };

    try {

      if (editFile) {

        const { dataUrl, mimeType, fileName } =
          await readFileAsDataUrl(editFile);

        updates.fileData = dataUrl;
        updates.mimeType = mimeType;
        updates.fileName = fileName;
        updates.name = editForm.name.trim() || fileName;
      }

      updateDocument(editingId, updates);

      setEditingId(null);
      setEditFile(null);

    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDoc = (id) => {

    if (
      window.confirm(
        'Delete this document? You can upload a new version anytime.'
      )
    ) {
      deleteDocument(id);

      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  return (
    <div className="page">

      <div className="page-intro">
        <h2 className="page-title">
          Documents &amp; disbursement
        </h2>

        <p className="page-subtitle">
          Upload, edit, or replace documents.
          Updated files must be verified again
          by your institution.
        </p>
      </div>

      <BankDetailsForm
        user={user}
        onSave={(data) => updateProfile(data)}
      />

      {!hasIdentity && (
        <div className="alert alert-info">
          Upload a <strong>Passport / photo ID</strong>
          for identity verification.
        </div>
      )}

      {/* UPLOAD FORM */}

      <form className="card form-card" onSubmit={handleUpload}>

        <h3 className="card-heading">
          Upload new document
        </h3>

        {error && !editingId && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-row">

          <div className="form-group">
            <label>Document label</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional label"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="form-group">
          <label>
            File * (PDF, JPG, PNG — max 2 MB)
          </label>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Upload
        </button>

      </form>

      {/* NORMAL DOCUMENTS */}

      <div className="card">

        <h3 className="card-heading">
          Your documents
        </h3>

        {docs.length === 0 ? (

          <p className="empty-text">
            No documents uploaded yet.
          </p>

        ) : (

          <table className="data-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {docs.map((d) => (

                <tr key={d.id}>

                  {editingId === d.id ? (

                    <td colSpan={5}>

                      <form
                        className="doc-edit-form"
                        onSubmit={saveEdit}
                      >

                        {error && (
                          <div className="alert alert-error">
                            {error}
                          </div>
                        )}

                        <div className="form-row">

                          <div className="form-group">
                            <label>Label</label>

                            <input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Category</label>

                            <select
                              value={editForm.type}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  type: e.target.value,
                                })
                              }
                            >
                              {DOC_TYPES.map((t) => (
                                <option
                                  key={t.value}
                                  value={t.value}
                                >
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>

                        </div>

                        <div className="form-group">

                          <label>
                            Replace file (optional)
                          </label>

                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              setEditFile(
                                e.target.files?.[0] || null
                              )
                            }
                          />

                        </div>

                        <div className="form-actions">

                          <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                          >
                            Save changes
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>

                        </div>

                      </form>

                    </td>

                  ) : (

                    <>

                      <td>{d.name}</td>

                      <td>{d.type}</td>

                      <td>{d.uploadedAt}</td>

                      <td>
                        <StatusBadge
                          status={
                            d.verified
                              ? 'approved'
                              : 'pending'
                          }
                        />
                      </td>

                      <td className="actions-cell">

                        {d.fileData && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setViewDoc(d)}
                          >
                            View
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => startEdit(d)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            handleDeleteDoc(d.id)
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </>

                  )}

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* APPLICATION DOCUMENTS */}

      {appDocs.length > 0 && (

        <div
          className="card"
          style={{ marginTop: '1.25rem' }}
        >

          <h3 className="card-heading">
            Scholarship eligibility documents
          </h3>

          <p className="signup-section-desc">
            These are tied to specific applications.
            To add or replace them after an institution
            remark, open that application under Applications.
          </p>

          <table className="data-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {appDocs.map((d) => (

                <tr key={d.id}>

                  <td>{d.name}</td>

                  <td>{d.type}</td>

                  <td>{d.uploadedAt}</td>

                  <td>
                    <StatusBadge
                      status={
                        d.verified
                          ? 'approved'
                          : 'pending'
                      }
                    />
                  </td>

                  <td className="actions-cell">

  {d.fileData && (
    <button
      type="button"
      className="btn btn-sm btn-secondary"
      onClick={() => setViewDoc(d)}
    >
      View
    </button>
  )}

  <button
    type="button"
    className="btn btn-sm btn-danger"
    onClick={() =>
      handleDeleteDoc(d.id)
    }
  >
    Delete
  </button>

</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {viewDoc && (
        <DocumentViewer
          doc={viewDoc}
          onClose={() => setViewDoc(null)}
        />
      )}

    </div>
  );
}
