import { hasCompleteBankDetails, hasVerifiedIdentity } from './bankHelpers';
import {
  getLatestFundRecord,
  studentHasReceivedScholarshipFund,
} from './fundHelpers';

export function isForwardedToAdmin(app) {
  if (app.forwardedToAdmin === true) return true;
  return app.institutionStatus === 'verified' && app.status !== 'institution-review';
}

export function isFinalized(app) {
  return app.status === 'approved' || app.status === 'rejected' || app.status === 'declined';
}

export function isWithdrawn(app) {
  return app.status === 'withdrawn';
}

export function canWithdraw(app) {
  if (isWithdrawn(app)) return false;
  if (app.fundStatus === 'sent' || app.fundStatus === 'received') return false;
  return true;
}

export function canStudentDeleteApplication(app) {
  return isWithdrawn(app) || canDeleteAfterFund(app);
}

export function canStaffDeleteApplication(app) {
  if (app.fundStatus === 'received') return true;
  if (isWithdrawn(app)) return true;
  if (app.forwardedToAdmin || app.institutionStatus === 'verified') return true;
  if (isFinalized(app)) return true;
  return app.status === 'institution-review';
}

export function canAdminDecide(app) {
  return isForwardedToAdmin(app) && app.status === 'pending';
}

export function filterApplicationsForAdmin(applications) {
  return applications.filter(isForwardedToAdmin);
}

export function canApproveApplication(app, student, documents) {
  if (!hasCompleteBankDetails(student)) {
    return { ok: false, reason: 'Student has not provided bank account details.' };
  }
  if (!hasVerifiedIdentity(student, documents)) {
    return { ok: false, reason: 'Student identity (passport / photo ID) is not verified.' };
  }
  return { ok: true };
}

export function getStudentApprovedApps(applications, studentId) {
  return applications.filter((a) => a.studentId === studentId && a.status === 'approved');
}

export function studentNeedsAwardSelection(applications, studentId) {
  const approved = getStudentApprovedApps(applications, studentId);
  const active = approved.filter((a) => a.selectedForAward && !a.awardDeclined);
  const pendingChoice = approved.filter((a) => !a.selectedForAward && !a.awardDeclined);
  return approved.length > 1 && active.length === 0 && pendingChoice.length > 1;
}

export function studentHasActiveAward(applications, studentId) {
  return applications.some(
    (a) => a.studentId === studentId && a.status === 'approved' && a.selectedForAward && a.fundStatus
  );
}

export function canSendFund(app) {
  return app.status === 'approved' && app.selectedForAward && !app.fundStatus;
}

export function canMarkFundReceived(app) {
  return app.fundStatus === 'sent';
}

export function canDeleteAfterFund(app) {
  return app.fundStatus === 'received';
}

export function studentHasReceivedFund(applications, studentId, user, fundRecords = []) {
  return studentHasReceivedScholarshipFund(user, fundRecords, applications, studentId);
}

export function getReceivedFundApplication(applications, studentId) {
  return applications.find(
    (a) => a.studentId === studentId && a.fundStatus === 'received'
  );
}

/** Block new applications after receiving a fund unless admin re-enabled eligibility. */
export function studentCanApplyForScholarship(user, applications, fundRecords = []) {
  const received = studentHasReceivedScholarshipFund(
    user,
    fundRecords,
    applications,
    user.id
  );
  if (!received) return { ok: true };
  if (user.scholarshipReapplyAllowed === true) return { ok: true };
  return {
    ok: false,
    reason:
      'You have already received a scholarship fund. Contact administration if you need to apply again.',
  };
}

/** Admin cannot send fund if student already received on a different application. */
export function canSendFundToStudent(app, applications, fundRecords = [], studentUser) {
  if (!canSendFund(app)) return { ok: false, reason: 'Fund cannot be sent for this application.' };

  const received = studentHasReceivedScholarshipFund(
    studentUser,
    fundRecords,
    applications,
    app.studentId
  );
  if (!received) return { ok: true };

  const priorApp = getReceivedFundApplication(applications, app.studentId);
  if (priorApp && priorApp.id === app.id) {
    return { ok: false, reason: 'This application already has fund activity recorded.' };
  }

  const priorRecord = getLatestFundRecord(fundRecords, applications, studentUser, app.studentId);
  const title =
    priorApp?.scholarshipTitle ||
    priorRecord?.scholarshipTitle ||
    studentUser?.lastReceivedScholarshipTitle ||
    'a prior scholarship';

  return {
    ok: false,
    reason: `Student already received funds for "${title}".`,
    priorApplication: priorApp,
    priorRecord,
  };
}

export function getApplicationRemarks(app) {
  return app.remarks || app.comments || [];
}

export function getApplicationDocuments(documents, applicationId) {
  return documents.filter((d) => d.applicationId === applicationId);
}

export function getStudentGeneralDocuments(documents, studentId) {
  return documents.filter((d) => d.studentId === studentId && !d.applicationId);
}

export function allApplicationDocsVerified(documents, applicationId) {
  const appDocs = getApplicationDocuments(documents, applicationId);
  if (appDocs.length === 0) return false;
  return appDocs.every((d) => d.verified);
}

export function allGeneralDocsVerified(documents, studentId) {
  const docs = getStudentGeneralDocuments(documents, studentId);
  if (docs.length === 0) return false;
  return docs.every((d) => d.verified);
}
