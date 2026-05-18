import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KEYS, getItem, setItem } from '../utils/storage';
import { getReceivedFundApplication } from '../utils/applicationHelpers';
import {
  buildFundRecordFromApplication,
  getLatestFundRecord,
  studentHasReceivedScholarshipFund,
  syncFundDataFromStorage,
} from '../utils/fundHelpers';
import { stripPassword } from '../utils/userHelpers';

const DataContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function updateUserRecord(userId, updates) {
  const users = getItem(KEYS.users, []);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  setItem(KEYS.users, users);
  const session = getItem(KEYS.session);
  if (session?.id === userId) {
    setItem(KEYS.session, stripPassword(users[idx]));
  }
}

export function DataProvider({ children }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const getScholarships = () => getItem(KEYS.scholarships, []);
  const getApplications = () => getItem(KEYS.applications, []);
  const getDocuments = () => getItem(KEYS.documents, []);
  const getAnnouncements = () => getItem(KEYS.announcements, []);
  const getNotifications = () => getItem(KEYS.notifications, []);
  const getFundRecords = () => getItem(KEYS.fundRecords, []);

  const saveScholarships = (data) => { setItem(KEYS.scholarships, data); refresh(); };
  const saveApplications = (data) => { setItem(KEYS.applications, data); refresh(); };
  const saveDocuments = (data) => { setItem(KEYS.documents, data); refresh(); };
  const saveAnnouncements = (data) => { setItem(KEYS.announcements, data); refresh(); };
  const saveNotifications = (data) => { setItem(KEYS.notifications, data); refresh(); };
  const saveFundRecords = (data) => { setItem(KEYS.fundRecords, data); refresh(); };

  useEffect(() => {
    syncFundDataFromStorage({ KEYS, getItem, setItem, uid });
  }, []);

  const addNotification = (notif) => {
    const list = getNotifications();
    list.unshift({
      ...notif,
      id: uid('notif'),
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveNotifications(list);
  };

  const markNotificationRead = (id) => {
    saveNotifications(
      getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = (userId) => {
    saveNotifications(
      getNotifications().map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      )
    );
  };

  const deleteNotification = (id) => {
    saveNotifications(getNotifications().filter((n) => n.id !== id));
  };

  const deleteAllNotifications = (userId) => {
    saveNotifications(getNotifications().filter((n) => n.userId !== userId));
  };

  const getUnreadNotificationCount = (userId) =>
    getNotifications().filter((n) => n.userId === userId && !n.read).length;

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
    const newApp = {
      ...app,
      id: app.id || uid('app'),
      appliedAt: new Date().toISOString().split('T')[0],
      fundStatus: null,
      remarks: app.remarks || app.comments || [],
    };
    list.push(newApp);
    saveApplications(list);
    return newApp.id;
  };

  const updateApplication = (id, updates) => {
    saveApplications(getApplications().map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteApplication = (id) => {
    saveApplications(getApplications().filter((a) => a.id !== id));
    saveDocuments(getDocuments().filter((d) => d.applicationId !== id));
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

  const addApplicationRemark = (applicationId, remark) => {
    const apps = getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return null;

    const entry = {
      id: uid('rmk'),
      ...remark,
      createdAt: new Date().toISOString(),
    };

    const remarks = [...(app.remarks || app.comments || []), entry];
    updateApplication(applicationId, {
      remarks,
      comments: undefined,
      documentUploadRequested: true,
    });

    if (remark.authorRole === 'institution' && app.studentId) {
      addNotification({
        userId: app.studentId,
        type: 'remark',
        title: 'Remark on your application',
        message: `${remark.authorName} sent a remark for "${app.scholarshipTitle}": ${remark.text}`,
        applicationId,
      });
    }

    return entry;
  };

  const clearDocumentUploadRequest = (applicationId, studentId) => {
    if (applicationId) {
      updateApplication(applicationId, {
        documentUploadRequested: false,
        lastDocumentRespondedAt: new Date().toISOString().split('T')[0],
      });
      return;
    }
    getApplications()
      .filter((a) => a.studentId === studentId && a.documentUploadRequested)
      .forEach((a) =>
        updateApplication(a.id, {
          documentUploadRequested: false,
          lastDocumentRespondedAt: new Date().toISOString().split('T')[0],
        })
      );
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
    clearDocumentUploadRequest(doc.applicationId, doc.studentId);
  };

  const updateDocument = (id, updates) => {
    const existing = getDocuments().find((d) => d.id === id);
    saveDocuments(getDocuments().map((d) => (d.id === id ? { ...d, ...updates } : d)));
    const appId = updates.applicationId ?? existing?.applicationId;
    const studentId = updates.studentId ?? existing?.studentId;
    if (updates.fileData || updates.verified === false) {
      clearDocumentUploadRequest(appId, studentId);
    }
  };

  const deleteDocument = (id) => {
    saveDocuments(getDocuments().filter((d) => d.id !== id));
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

  const sendFund = (applicationId, { force = false } = {}) => {
    const app = getApplications().find((a) => a.id === applicationId);
    if (!app) return { ok: false, reason: 'Application not found.' };

    const applications = getApplications();
    const fundRecords = getFundRecords();
    const studentUser = getItem(KEYS.users, []).find((u) => u.id === app.studentId);
    const alreadyReceived = studentHasReceivedScholarshipFund(
      studentUser,
      fundRecords,
      applications,
      app.studentId
    );

    if (alreadyReceived && !force) {
      const priorApp = getReceivedFundApplication(applications, app.studentId);
      const priorRecord = getLatestFundRecord(
        fundRecords,
        applications,
        studentUser,
        app.studentId
      );
      const priorTitle =
        priorApp?.scholarshipTitle ||
        priorRecord?.scholarshipTitle ||
        studentUser?.lastReceivedScholarshipTitle ||
        'a prior scholarship';

      addNotification({
        userId: app.studentId,
        type: 'fund-blocked',
        title: 'Fund disbursement cancelled',
        message: `A fund send for "${app.scholarshipTitle}" was cancelled because you already received scholarship funds for "${priorTitle}".`,
        applicationId,
      });
      return {
        ok: false,
        reason: `This student already received funds for "${priorTitle}".`,
        priorApplication: priorApp,
        priorRecord,
      };
    }

    updateApplication(applicationId, {
      fundStatus: 'sent',
      fundSentAt: new Date().toISOString().split('T')[0],
    });

    addNotification({
      userId: app.studentId,
      type: 'fund-sent',
      title: 'Scholarship fund sent',
      message: `Funds for "${app.scholarshipTitle}" have been sent. Please confirm when received.`,
      applicationId,
    });

    return { ok: true };
  };

  const markFundReceived = (applicationId) => {
    const app = getApplications().find((a) => a.id === applicationId);
    if (!app) return;

    const receivedAt = new Date().toISOString().split('T')[0];
    const scholarship = getScholarships().find((s) => s.id === app.scholarshipId);
    const studentUser = getItem(KEYS.users, []).find((u) => u.id === app.studentId);

    updateApplication(applicationId, {
      fundStatus: 'received',
      fundReceivedAt: receivedAt,
    });

    const records = getFundRecords();
    if (!records.some((r) => r.applicationId === app.id)) {
      records.unshift({
        id: uid('fund'),
        ...buildFundRecordFromApplication(
          { ...app, fundReceivedAt: receivedAt },
          scholarship,
          studentUser
        ),
        recordedAt: receivedAt,
      });
      saveFundRecords(records);
    }

    updateUserRecord(app.studentId, {
      hasReceivedScholarshipFund: true,
      scholarshipReapplyAllowed: false,
      scholarshipFundReceivedAt: receivedAt,
      lastReceivedScholarshipTitle: app.scholarshipTitle,
      lastReceivedScholarshipAmount: scholarship?.amount ?? null,
    });

    addNotification({
      userId: app.studentId,
      type: 'fund-received',
      title: 'Fund receipt confirmed',
      message: `You confirmed receipt of funds for "${app.scholarshipTitle}". You cannot apply for new scholarships until administration allows it.`,
      applicationId,
    });
  };

  const allowStudentReapply = (studentId, adminName) => {
    updateUserRecord(studentId, { scholarshipReapplyAllowed: true });
    addNotification({
      userId: studentId,
      type: 'reapply-allowed',
      title: 'You may apply again',
      message: `${adminName || 'Administration'} has allowed you to apply for new scholarship programs.`,
    });
    refresh();
  };

  const resetAllStudentsEligibility = (adminName) => {
    const users = getItem(KEYS.users, []);
    const fundRecords = getFundRecords();
    const applications = getApplications();
    const students = users.filter(
      (u) =>
        u.role === 'student' &&
        studentHasReceivedScholarshipFund(u, fundRecords, applications, u.id)
    );
    students.forEach((s) => {
      updateUserRecord(s.id, { scholarshipReapplyAllowed: true });
      addNotification({
        userId: s.id,
        type: 'global-reset',
        title: 'New scholarship cycle open',
        message: `${adminName || 'Administration'} has reset eligibility. All students may now apply for new scholarship programs.`,
      });
    });
    refresh();
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
    addScholarship,
    updateScholarship,
    approveScholarship,
    deleteScholarship,
    addApplication,
    updateApplication,
    deleteApplication,
    withdrawApplication,
    addApplicationRemark,
    addDocument,
    updateDocument,
    deleteDocument,
    selectAward,
    sendFund,
    markFundReceived,
    allowStudentReapply,
    resetAllStudentsEligibility,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications,
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
