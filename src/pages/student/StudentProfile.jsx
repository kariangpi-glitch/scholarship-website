import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import BankDetailsForm from '../../components/BankDetailsForm';
import { readFileAsDataUrl } from '../../utils/fileUtils';

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function UploadIcon() {
  return (
    <svg className="profile-photo__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    setPhotoSaved(false);
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please upload a passport-style photo as JPEG, PNG, or WebP.');
      e.target.value = '';
      return;
    }

    try {
      const { dataUrl, mimeType, fileName } = await readFileAsDataUrl(file);
      updateProfile({
        profilePicture: {
          fileName,
          fileData: dataUrl,
          mimeType,
          uploadedAt: new Date().toISOString().split('T')[0],
        },
      });
      setPhotoSaved(true);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (!profilePhoto?.fileData) return;
    if (!window.confirm('Remove your profile photo?')) return;
    updateProfile({ profilePicture: null });
    setPhotoSaved(false);
    setPhotoError('');
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">My profile</h2>
        <p className="page-subtitle">
          Manage your personal information, passport-style profile photo, and disbursement bank account.
        </p>
      </div>

      <BankDetailsForm user={user} onSave={(data) => updateProfile(data)} />

      <form className="card form-card" onSubmit={handleSubmit}>
        <h3 className="card-heading">Profile photo</h3>
        <p className="signup-section-desc">
          Upload a clear passport-style photo (head and shoulders, plain background). This helps identify
          your account alongside your official ID documents.
        </p>
        {photoError && <div className="alert alert-error">{photoError}</div>}
        {photoSaved && <div className="alert alert-success">Profile photo saved successfully.</div>}
        <div className={`profile-photo${hasPhoto ? ' profile-photo--has-image' : ''}`}>
          <div className={`profile-photo__preview${hasPhoto ? '' : ' profile-photo__preview--empty'}`}>
            {hasPhoto ? (
              <img src={profilePhoto.fileData} alt="Your profile" />
            ) : (
              <div className="profile-photo__empty">
                <span className="profile-photo__empty-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="profile-photo__empty-text">No photo yet</span>
              </div>
            )}
          </div>

          <div className="profile-photo__panel">
            <p className="profile-photo__title">Passport photograph</p>
            <p className="profile-photo__guidance">
              Recent photo, neutral expression, plain light background. Face clearly visible.
            </p>

            <input
              ref={photoInputRef}
              id="profilePhoto"
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              className="profile-photo__input"
              onChange={handlePhotoChange}
            />

            <label htmlFor="profilePhoto" className="profile-photo__upload">
              <span className="profile-photo__upload-icon-wrap">
                <UploadIcon />
              </span>
              <span className="profile-photo__upload-copy">
                <span className="profile-photo__upload-label">
                  {hasPhoto ? 'Replace photograph' : 'Upload passport photo'}
                </span>
                <span className="profile-photo__upload-meta">JPEG, PNG or WebP · maximum 2 MB</span>
              </span>
            </label>

            {hasPhoto && (
              <button type="button" className="profile-photo__remove" onClick={handleRemovePhoto}>
                Remove photo
              </button>
            )}

            {profilePhoto?.uploadedAt && (
              <p className="profile-photo__updated">Last updated {profilePhoto.uploadedAt}</p>
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
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="university">University</label>
          <input id="university" name="university" value={form.university} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="major">Field of study</label>
          <input id="major" name="major" value={form.major} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="gpa">GPA</label>
          <input id="gpa" name="gpa" value={form.gpa} onChange={handleChange} />
        </div>
        <button type="submit" className="btn btn-primary">Save profile</button>
      </form>
    </div>
  );
}
