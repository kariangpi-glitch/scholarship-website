import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KEYS, getItem, setItem } from '../utils/storage';
import {
  buildFundRecordFromApplication,
  studentHasReceivedScholarshipFund,
  syncFundDataFromStorage,
} from '../utils/fundHelpers';
import { stripPassword } from '../utils/userHelpers';
import { applicationStatusMessage, fundStatusMessage } from '../utils/notificationHelpers';

const DataContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DataProvider({ children }) {
  const [tick, setTick] = useState(0);
  const [mysqlScholarships, setMysqlScholarships] = useState([]);
  const [mysqlDocuments, setMysqlDocuments] = useState([]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    syncFundDataFromStorage({ KEYS, getItem, setItem, uid });
  }, []);
  useEffect(() => {
    fetch("http://127.0.0.1:5050/scholarships")
      .then((res) => res.json())
      .then((data) => setMysqlScholarships(data))
      .catch((err) => console.log(err));
  }, []);
  useEffect(() => {
    fetch("http://127.0.0.1:5050/documents")
      .then((res) => res.json())
      .then((data) => setMysqlDocuments(data))
      .catch((err) => console.log(err));
  }, [tick]);

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

  const getScholarships = () => mysqlScholarships;
  const getApplications = () => getItem(KEYS.applications, []);
  const getDocuments = () =>
    mysqlDocuments.map((d) => ({
      id: d.id,
      studentId: d.student_id,
      studentName: d.student_name,
      applicationId: d.application_id,
      scholarshipId: d.scholarship_id,
      name: d.name,
      type: d.type,
      fileName: d.file_name,
      fileData: d.file_data,
      mimeType: d.mime_type,
      uploadedAt: d.uploaded_at?.split("T")[0] || d.uploaded_at,
      verified: Boolean(d.verified),
      verifiedBy: d.verified_by,
    }));
  const getAnnouncements = () => getItem(KEYS.announcements, []);
  const getNotifications = () => getItem(KEYS.notifications, []);
  const getFundRecords = () => getItem(KEYS.fundRecords, []);

  const saveScholarships = (data) => { setItem(KEYS.scholarships, data); emitDataChange(); };
  const saveApplications = (data) => { setItem(KEYS.applications, data); emitDataChange(); };
  const saveDocuments = (data) => { setItem(KEYS.documents, data); emitDataChange(); };
  const saveAnnouncements = (data) => { setItem(KEYS.announcements, data); emitDataChange(); };
  const saveNotifications = (data) => { setItem(KEYS.notifications, data); emitDataChange(); };
  const saveFundRecords = (data) => { setItem(KEYS.fundRecords, data); emitDataChange(); };
  const saveUsers = (data) => { setItem(KEYS.users, data); emitDataChange(); };

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

  const addApplication = async (app) => {
    const newApp = {
      ...app,
      id: uid('app'),
      appliedAt: new Date().toISOString().split('T')[0],
      fundStatus: null,
    };
  
    console.log("TRYING TO SAVE APPLICATION:", newApp);
  
    try {
      const res = await fetch('http://127.0.0.1:5050/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });
  
      const data = await res.json();
  
      console.log("MYSQL APPLICATION RESPONSE:", data);
  
      if (!res.ok) {
        alert("MySQL save failed: " + (data.details || data.error));
        return null;
      }
  
      const list = getApplications();
      list.push(newApp);
      saveApplications(list);
  
      return newApp.id;
    } catch (err) {
      console.error("FETCH ERROR:", err);
      alert("Backend connection failed. Check server.");
      return null;
    }
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

  const addDocument = async (doc) => {
    const newDoc = {
      ...doc,
      id: uid("doc"),
      uploadedAt: new Date().toISOString().split("T")[0],
      verified: false,
      verifiedBy: null,
    };
  
    try {
      const res = await fetch("http://127.0.0.1:5050/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDoc),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.details || data.error || "Document upload failed");
        return false;
      }
  
      refresh();
      return true;
    } catch (err) {
      console.log("DOCUMENT ERROR:", err);
      return false;
    }
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

  const deleteDocument = async (id) => {
    try {
      await fetch(`http://127.0.0.1:5050/documents/${id}`, {
        method: "DELETE",
      });
  
      refresh();
    } catch (err) {
      console.log(err);
    }
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
    const records = getFundRecords();
saveFundRecords(
  records.map((r) =>
    r.studentId === studentId
      ? { ...r, reapplyAllowed: true }
      : r
  )
);

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
    const apps = getApplications();
    const prev = apps.find((a) => a.id === applicationId);
    if (!prev) return;

    const fundReceivedAt = new Date().toISOString().split('T')[0];
    updateApplication(applicationId, {
      fundStatus: 'received',
      fundReceivedAt,
    });

    const users = getItem(KEYS.users, []);
    const studentIdx = users.findIndex((u) => u.id === prev.studentId);
    const scholarship = getScholarships().find((s) => s.id === prev.scholarshipId);
    const receivedApp = {
      ...prev,
      fundStatus: 'received',
      fundReceivedAt,
    };

    if (studentIdx !== -1) {
      users[studentIdx] = {
        ...users[studentIdx],
        hasReceivedScholarshipFund: true,
        scholarshipReapplyAllowed: false,
        scholarshipFundReceivedAt: fundReceivedAt,
        lastReceivedScholarshipTitle: prev.scholarshipTitle,
        lastReceivedScholarshipAmount: scholarship?.amount ?? null,
      };
      setItem(KEYS.users, users);

      const session = getItem(KEYS.session);
      if (session?.id === prev.studentId) {
        setItem(KEYS.session, stripPassword(users[studentIdx]));
      }
    }

    const fundRecords = getFundRecords();
    if (!fundRecords.some((r) => r.applicationId === applicationId)) {
      const student = studentIdx !== -1 ? users[studentIdx] : null;
      saveFundRecords([
        {
          id: uid('fund'),
          ...buildFundRecordFromApplication(receivedApp, scholarship, student),
          recordedAt: fundReceivedAt,
        },
        ...fundRecords,
      ]);
    } else {
      emitDataChange();
    }
  };

  const allowStudentReapply = (studentId, adminName) => {
    const users = getItem(KEYS.users, []);
  
    const updatedUsers = users.map((u) =>
      u.id === studentId
        ? {
            ...u,
            scholarshipReapplyAllowed: true,
            hasReceivedScholarshipFund: false,
            scholarshipReapplyAllowedAt: new Date().toISOString().split('T')[0],
            scholarshipReapplyAllowedBy: adminName || 'Administrator',
          }
        : u
    );
  
    saveUsers(updatedUsers);
  
    const records = getFundRecords();
  
    saveFundRecords(
      records.map((r) =>
        r.studentId === studentId
          ? { ...r, reapplyAllowed: true }
          : r
      )
    );
  
    const session = getItem(KEYS.session);
    if (session?.id === studentId) {
      const refreshed = updatedUsers.find((u) => u.id === studentId);
      setItem(KEYS.session, stripPassword(refreshed));
    }
  
    addNotification({
      userId: studentId,
      type: 'success',
      title: 'You may apply again',
      message: 'The administration has allowed you to apply for new scholarship programs.',
    });
  
    emitDataChange();
  };

  const resetAllStudentsEligibility = (adminName) => {
    const users = getItem(KEYS.users, []);
    const allowedAt = new Date().toISOString().split('T')[0];
    const allowedBy = adminName || 'Administrator';
  
    const updatedUsers = users.map((u) =>
      u.role === 'student'
        ? {
            ...u,
            scholarshipReapplyAllowed: true,
            hasReceivedScholarshipFund: false,
            scholarshipReapplyAllowedAt: allowedAt,
            scholarshipReapplyAllowedBy: allowedBy,
          }
        : u
    );
  
    saveUsers(updatedUsers);
  
    saveFundRecords(
      getFundRecords().map((r) => ({
        ...r,
        reapplyAllowed: true,
      }))
    );
  
    saveApplications(
      getApplications().filter((a) => a.fundStatus !== 'received')
    );
  
    const session = getItem(KEYS.session);
    if (session?.id) {
      const refreshed = updatedUsers.find((u) => u.id === session.id);
      if (refreshed) setItem(KEYS.session, stripPassword(refreshed));
    }
  
    emitDataChange();
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
    allowStudentReapply,
    resetAllStudentsEligibility,
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
