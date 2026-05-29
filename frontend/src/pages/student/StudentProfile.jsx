import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import BankDetailsForm from '../../components/BankDetailsForm';
import { readFileAsDataUrl } from '../../utils/fileUtils';

const API_URL = 'http://127.0.0.1:5050';
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    university: user?.university || '',
    major: user?.major || '',
    gpa: user?.gpa || '',
  });

  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);

  const profilePhoto = user?.profilePicture;
  const hasPhoto = Boolean(profilePhoto?.fileData);

  const saveToBackend = async (updates) => {
    const finalData = {
      ...user,
      ...form,
      ...updates,
    };

    await fetch(`${API_URL}/users/${user.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });

    updateProfile(updates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveToBackend(form);
    setSaved(true);
  };

  const handleBankSave = async (data) => {
    const bank = data.bankAccount;
  
    await fetch(`${API_URL}/users/${user.id}/bank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank),
    });
  
    updateProfile(data);
  };
  
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    setPhotoSaved(false);
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please upload JPEG, PNG, or WebP.');
      return;
    }

    try {
      const { dataUrl, mimeType, fileName } = await readFileAsDataUrl(file);

      const profilePicture = {
        fileName,
        fileData: dataUrl,
        mimeType,
        uploadedAt: new Date().toISOString().split('T')[0],
      };

      await saveToBackend({
        profilePicture,
        profilePhoto: dataUrl,
        profilePhotoMime: mimeType,
      });

      setPhotoSaved(true);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    await saveToBackend({
      profilePicture: null,
      profilePhoto: null,
      profilePhotoMime: null,
    });
    setPhotoSaved(false);
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">My profile</h2>
        <p className="page-subtitle">
          Manage your personal information, passport-style profile photo, and disbursement bank account.
        </p>
      </div>

      <BankDetailsForm user={user} onSave={handleBankSave} />

      <form className="card form-card" onSubmit={handleSubmit}>
        <h3 className="card-heading">Profile photo</h3>

        {photoError && <div className="alert alert-error">{photoError}</div>}
        {photoSaved && <div className="alert alert-success">Profile photo saved successfully.</div>}

        <div className={`profile-photo${hasPhoto ? ' profile-photo--has-image' : ''}`}>
          <div className={`profile-photo__preview${hasPhoto ? '' : ' profile-photo__preview--empty'}`}>
            {hasPhoto ? (
              <img src={profilePhoto.fileData} alt="Your profile" />
            ) : (
              <div className="profile-photo__empty">
                <span>No photo yet</span>
              </div>
            )}
          </div>

          <div className="profile-photo__panel">
            <p className="profile-photo__title">Passport photograph</p>

            <input
              ref={photoInputRef}
              id="profilePhoto"
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              className="profile-photo__input"
              onChange={handlePhotoChange}
            />

            <label htmlFor="profilePhoto" className="profile-photo__upload">
              {hasPhoto ? 'Replace photograph' : 'Upload passport photo'}
            </label>

            {hasPhoto && (
              <button type="button" className="profile-photo__remove" onClick={handleRemovePhoto}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        <h3 className="card-heading profile-section-heading">Personal information</h3>

        {saved && <div className="alert alert-success">Profile updated successfully.</div>}

        <div className="form-group">
          <label>Email</label>
          <input value={user?.email || ''} disabled />
        </div>

        <div className="form-group">
          <label>Full name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="form-group">
          <label>University</label>
          <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
        </div>

        <div className="form-group">
          <label>Field of study</label>
          <input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
        </div>

        <div className="form-group">
          <label>GPA</label>
          <input value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} />
        </div>

        <button type="submit" className="btn btn-primary">Save profile</button>
      </form>
    </div>
  );
}
