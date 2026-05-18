import { KEYS, getItem } from './storage';

export function normalizeBank(bank = {}) {
  return {
    accountHolder: (bank.accountHolder || '').trim().toLowerCase(),
    bankName: (bank.bankName || '').trim().toLowerCase(),
    accountNumber: (bank.accountNumber || '').replace(/\s/g, ''),
    routingNumber: (bank.routingNumber || '').replace(/\s/g, ''),
  };
}

export function hasCompleteBankDetails(user) {
  const b = user?.bankAccount;
  return !!(b?.accountHolder?.trim() && b?.bankName?.trim() && b?.accountNumber?.trim());
}

export function detectBankFraud(studentId, bankAccount) {
  const users = getItem(KEYS.users, []);
  const current = normalizeBank(bankAccount);
  const warnings = [];

  const otherAccountsSameStudent = users.filter(
    (u) => u.id === studentId && u.bankAccount && u._bankHistory
  );

  const sameStudentMultiBank = users.find((u) => {
    if (u.id !== studentId || !u.bankAccount) return false;
    const n = normalizeBank(u.bankAccount);
    return (
      u._altBankAccounts?.length > 0 ||
      (n.accountNumber && current.accountNumber && n.accountNumber !== current.accountNumber)
    );
  });

  users.forEach((u) => {
    if (u.role !== 'student' || u.id === studentId || !u.bankAccount) return;
    const other = normalizeBank(u.bankAccount);
    if (other.accountNumber && current.accountNumber && other.accountNumber === current.accountNumber) {
      warnings.push({
        type: 'duplicate-account',
        message: `Account number matches another student (${u.name}). Possible duplicate claim.`,
        severity: 'high',
      });
    }
    if (
      other.accountHolder &&
      current.accountHolder &&
      other.accountHolder === current.accountHolder &&
      other.accountNumber !== current.accountNumber
    ) {
      warnings.push({
        type: 'same-holder-different-bank',
        message: `Account holder name matches ${u.name} but uses a different account number.`,
        severity: 'medium',
      });
    }
  });

  if (sameStudentMultiBank) {
    warnings.push({
      type: 'multiple-banks-one-student',
      message: 'This student may have registered more than one bank account.',
      severity: 'high',
    });
  }

  return warnings;
}

export function getStudentPassportDocs(documents, studentId) {
  return documents.filter((d) => d.studentId === studentId && d.type === 'identity-passport');
}

export function hasVerifiedIdentity(user, documents) {
  const profileOk = user?.identityVerified === true;
  const docOk = getStudentPassportDocs(documents, user?.id).some((d) => d.verified && d.fileData);
  return profileOk || docOk;
}

export function getIdentityVerificationSummary(user, documents) {
  const passportDocs = getStudentPassportDocs(documents, user?.id);
  const hasUpload = passportDocs.some((d) => d.fileData);
  const docVerified = passportDocs.some((d) => d.verified);
  const institutionVerified = user?.identityVerified === true;
  return {
    hasUpload,
    docVerified,
    institutionVerified,
    readyForAdmin: institutionVerified || docVerified,
    institutionName: user?.identityVerifiedByInstitutionName || null,
    verifiedAt: user?.identityVerifiedAt || null,
  };
}

export function canInstitutionApproveIdentity(user, documents) {
  const summary = getIdentityVerificationSummary(user, documents);
  if (!summary.hasUpload) {
    return { ok: false, reason: 'Student has not uploaded a Passport / photo ID yet.' };
  }
  if (summary.readyForAdmin) {
    return { ok: false, reason: 'Student identity is already verified.' };
  }
  return { ok: true };
}
