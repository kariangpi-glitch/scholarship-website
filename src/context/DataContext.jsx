import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KEYS, getItem, setItem } from '../utils/storage';
import { syncFundDataFromStorage } from '../utils/fundHelpers';
import { stripPassword } from '../utils/userHelpers';
import { applicationStatusMessage, fundStatusMessage } from '../utils/notificationHelpers';

const DataContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DataProvider({ children }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    syncFundDataFromStorage({ KEYS, getItem, setItem, uid });
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key?.startsWith('sh_')) refresh();
    };
    const onLocalChange = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('sh-data-changed', onLocalChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sh-data-changed', onLocalChange);
    };
  }, [refresh]);

  const emitDataChange = () => {
    refresh();
    window.dispatchEvent(new Event('sh-data-changed'));
  };

  const getScholarships = () => getItem(KEYS.scholarships, []);
  const getApplications = () => getItem(KEYS.applications, []);
  const getDocuments = () => getItem(KEYS.documents, []);
  const getAnnouncements = () => getItem(KEYS.announcements, []);
  const getNotifications = () => getItem(KEYS.notifications, []);
  const getFundRecords = () => getItem(KEYS.fundRecords, []);

  const saveScholarships = (data) => { setItem(KEYS.scholarships, data); emitDataChange(); };
  const saveApplications = (data) => { setItem(KEYS.applications, data); emitDataChange(); };
  const saveDocuments = (data) => { setItem(KEYS.documents, data); emitDataChange(); };
  const saveAnnouncements = (data) => { setItem(KEYS.announcements, data); emitDataChange(); };
  const saveNotifications = (data) => { setItem(KEYS.notifications, data); emitDataChange(); };

  const addNotification = ({ userId, type = 'info', title, message, applicationId = null }) => {
    if (!userId || !title) return;
    const list = getNotifications();
    list.unshift({
      id: uid('notif'),
      userId,
      type,
      title,
      message: message || '',
      applicationId,
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveNotifications(list);
  };

  const getUnreadNotificationCount = (userId) =>
    getNotifications().filter((n) => n.userId === userId && !n.read).length;

  const markNotificationRead = (id) => {
    saveNotifications(getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = (userId) => {
    saveNotifications(
      getNotifications().map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id) => {
    saveNotifications(getNotifications().filter((n) => n.id !== id));
  };

  const deleteAllNotifications = (userId) => {
    saveNotifications(getNotifications().filter((n) => n.userId !== userId));
  };

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
    const apps = getApplications();
    const prev = apps.find((a) => a.id === id);
    if (!prev) return;
    const next = { ...prev, ...updates };
    saveApplications(apps.map((a) => (a.id === id ? next : a)));

    if (prev.studentId) {
      const forwardedNow = updates.forwardedToAdmin && !prev.forwardedToAdmin;
      if (forwardedNow) {
        const { title, message } = applicationStatusMessage(next, 'pending');
        addNotification({
          userId: prev.studentId,
          type: 'info',
          title,
          message,
          applicationId: id,
        });
      } else if (updates.status && updates.status !== prev.status) {
        const { title, message } = applicationStatusMessage(next, updates.status);
        addNotification({
          userId: prev.studentId,
          type: updates.status === 'approved' ? 'success' : updates.status === 'rejected' ? 'warning' : 'info',
          title,
          message,
          applicationId: id,
        });
      }

      if (updates.fundStatus && updates.fundStatus !== prev.fundStatus) {
        const fundMsg = fundStatusMessage(next, updates.fundStatus);
        if (fundMsg) {
          addNotification({
            userId: prev.studentId,
            type: 'success',
            title: fundMsg.title,
            message: fundMsg.message,
            applicationId: id,
          });
        }
      }
    }
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
    const docs = getDocuments();
    const prev = docs.find((d) => d.id === id);
    const next = prev ? { ...prev, ...updates } : null;
    saveDocuments(docs.map((d) => (d.id === id ? next : d)));

    if (prev?.studentId && updates.verified && !prev.verified) {
      const docLabel = prev.type === 'identity-passport' ? 'Passport / photo ID' : prev.name || 'document';
      addNotification({
        userId: prev.studentId,
        type: 'success',
        title: 'Document verified',
        message: `Your institution verified your ${docLabel}.`,
        applicationId: prev.applicationId || null,
      });
    }
  };

  const deleteDocument = (id) => {
    saveDocuments(getDocuments().filter((d) => d.id !== id));
  };

  const verifyStudentIdentity = (studentId, institution) => {
    const docs = getDocuments();
    const passportIds = docs
      .filter((d) => d.studentId === studentId && d.type === 'identity-passport')
      .map((d) => d.id);
    if (passportIds.length === 0) {
      return { ok: false, reason: 'No passport / photo ID on file for this student.' };
    }

    saveDocuments(
      docs.map((d) =>
        passportIds.includes(d.id)
          ? { ...d, verified: true, verifiedBy: institution.id }
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
      setItem(KEYS.session, stripPassword(users[idx]));
    }

    const student = users[idx];
    addNotification({
      userId: studentId,
      type: 'success',
      title: 'Identity verified',
      message: `${institution.name || 'Your institution'} verified your passport / photo ID. Your application can proceed to administration.`,
    });

    emitDataChange();
    return { ok: true };
  };

  const selectAward = (studentId, applicationId) => {
    const list = getApplications();
    const selected = list.find((a) => a.id === applicationId);
    const updated = list.map((a) => {
      if (a.studentId !== studentId || a.status !== 'approved') return a;
      if (a.id === applicationId) return { ...a, selectedForAward: true, awardDeclined: false };
      return { ...a, selectedForAward: false, awardDeclined: true };
    });
    saveApplications(updated);
    if (selected) {
      addNotification({
        userId: studentId,
        type: 'success',
        title: 'Award selected',
        message: `You selected "${selected.scholarshipTitle}" as your scholarship award.`,
        applicationId,
      });
    }
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
    getNotifications,
    getFundRecords,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications,
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
    addNotification,
    refresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
