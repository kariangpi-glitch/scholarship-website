import { hasCompleteBankDetails, hasVerifiedIdentity } from './bankHelpers';
import { studentIsBlockedFromApplying } from './fundHelpers';

export function studentCanApplyForScholarship(user, applications, fundRecords) {
  if (studentIsBlockedFromApplying(user, fundRecords, applications)) {
    return {
      ok: false,
      reason:
        'You have already received scholarship funds. The administration must allow you to apply again before you can submit a new application.',
    };
  }
  return { ok: true };
}

export function isForwardedToAdmin(app) {
  if (app.forwardedToAdmin === true) return true;
  return app.institutionStatus === 'verified' && app.status !== 'institution-review';
}

export function isFinalized(app) {
  return app.status === 'approved' || app.status === 'rejected' || app.status === 'declined';
}

export function isDeclinedByAdmin(app) {
  return app.status === 'rejected' || app.status === 'declined';
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
  if (isDeclinedByAdmin(app) && !app.fundStatus) return true;
  return isWithdrawn(app) || canDeleteAfterFund(app);
}

export function canStaffDeleteApplication(app) {
  if (app.fundStatus === 'received') return true;
  if (isDeclinedByAdmin(app) && !app.fundStatus) return true;
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
    return {
      ok: false,
      reason:
        'Student identity is not verified. The institution must approve the passport / photo ID before you can approve.',
    };
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
