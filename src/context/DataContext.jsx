import { createContext, useContext, useState, useCallback } from 'react';
import { KEYS, getItem, setItem } from '../utils/storage';

const DataContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DataProvider({ children }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const getScholarships = () => getItem(KEYS.scholarships, []);
  const getApplications = () => getItem(KEYS.applications, []);
  const getDocuments = () => getItem(KEYS.documents, []);
  const getAnnouncements = () => getItem(KEYS.announcements, []);

  const saveScholarships = (data) => { setItem(KEYS.scholarships, data); refresh(); };
  const saveApplications = (data) => { setItem(KEYS.applications, data); refresh(); };
  const saveDocuments = (data) => { setItem(KEYS.documents, data); refresh(); };
  const saveAnnouncements = (data) => { setItem(KEYS.announcements, data); refresh(); };

  const addScholarship = (sch, { institutionRequest = false } = {}) => {
    const list = getScholarships();
    list.push({
      ...sch,
      id: uid('sch'),
      status: institutionRequest ? 'inactive' : 'active',
      approvalStatus: institutionRequest ? 'pending' : 'approved',
    });
    saveScholarships(list);
  };

  const updateScholarship = (id, updates) => {
    saveScholarships(getScholarships().map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const approveScholarship = (id) => {
    updateScholarship(id, { approvalStatus: 'approved', status: 'active' });
  };

  const deleteScholarship = (id) => {
    saveScholarships(getScholarships().filter((s) => s.id !== id));
  };

  const addApplication = (app) => {
    const list = getApplications();
    list.push({ ...app, id: uid('app'), appliedAt: new Date().toISOString().split('T')[0], fundStatus: null });
    saveApplications(list);
  };

  const updateApplication = (id, updates) => {
    saveApplications(getApplications().map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteApplication = (id) => {
    saveApplications(getApplications().filter((a) => a.id !== id));
  };

  const withdrawApplication = (id) => {
    updateApplication(id, {
      status: 'withdrawn',
      withdrawnAt: new Date().toISOString().split('T')[0],
      selectedForAward: false,
      awardDeclined: false,
      forwardedToAdmin: false,
    });
  };

  const addDocument = (doc) => {
    const list = getDocuments();
    list.push({
      ...doc,
      id: uid('doc'),
      uploadedAt: new Date().toISOString().split('T')[0],
      verified: false,
      verifiedBy: null,
    });
    saveDocuments(list);
  };

  const updateDocument = (id, updates) => {
    saveDocuments(getDocuments().map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDocument = (id) => {
    saveDocuments(getDocuments().filter((d) => d.id !== id));
  };

  const verifyStudentIdentity = (studentId, institution) => {
    const docs = getDocuments();
    const passportIds = docs
      .filter((d) => d.studentId === studentId && d.type === 'identity-passport')
      .map((d) => d.id);
    if (passportIds.length === 0) return { ok: false, reason: 'No passport / photo ID on file.' };

    saveDocuments(
      docs.map((d) =>
        passportIds.includes(d.id)
          ? {
              ...d,
              verified: true,
              verifiedBy: institution.id,
              identityApprovedByInstitution: true,
            }
          : d
      )
    );

    const users = getItem(KEYS.users, []);
    const idx = users.findIndex((u) => u.id === studentId);
    if (idx === -1) return { ok: false, reason: 'Student not found.' };
    const verifiedAt = new Date().toISOString().split('T')[0];
    users[idx] = {
      ...users[idx],
      identityVerified: true,
      identityVerifiedAt: verifiedAt,
      identityVerifiedByInstitutionId: institution.id,
      identityVerifiedByInstitutionName: institution.name || 'Institution',
    };
    setItem(KEYS.users, users);

    const session = getItem(KEYS.session);
    if (session?.id === studentId) {
      setItem(KEYS.session, { ...session, ...users[idx] });
    }

    refresh();
    return { ok: true };
  };

  const selectAward = (studentId, applicationId) => {
    const list = getApplications();
    const updated = list.map((a) => {
      if (a.studentId !== studentId || a.status !== 'approved') return a;
      if (a.id === applicationId) return { ...a, selectedForAward: true, awardDeclined: false };
      return { ...a, selectedForAward: false, awardDeclined: true };
    });
    saveApplications(updated);
  };

  const sendFund = (applicationId) => {
    updateApplication(applicationId, {
      fundStatus: 'sent',
      fundSentAt: new Date().toISOString().split('T')[0],
    });
  };

  const markFundReceived = (applicationId) => {
    updateApplication(applicationId, {
      fundStatus: 'received',
      fundReceivedAt: new Date().toISOString().split('T')[0],
    });
  };

  const addAnnouncement = (ann) => {
    const list = getAnnouncements();
    list.unshift({ ...ann, id: uid('ann'), createdAt: new Date().toISOString().split('T')[0] });
    saveAnnouncements(list);
  };

  const deleteAnnouncement = (id) => {
    saveAnnouncements(getAnnouncements().filter((a) => a.id !== id));
  };

  const value = {
    tick,
    getScholarships,
    getApplications,
    getDocuments,
    getAnnouncements,
    addScholarship,
    updateScholarship,
    approveScholarship,
    deleteScholarship,
    addApplication,
    updateApplication,
    deleteApplication,
    withdrawApplication,
    addDocument,
    updateDocument,
    deleteDocument,
    verifyStudentIdentity,
    selectAward,
    sendFund,
    markFundReceived,
    addAnnouncement,
    deleteAnnouncement,
    refresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
