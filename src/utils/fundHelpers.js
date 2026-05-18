/** Permanent fund receipt — survives scholarship/application deletion. */
export function studentHasReceivedScholarshipFund(user, fundRecords, applications, studentId) {
  if (user?.hasReceivedScholarshipFund === true) return true;
  if (fundRecords?.some((r) => r.studentId === studentId)) return true;
  return applications?.some(
    (a) => a.studentId === studentId && a.fundStatus === 'received'
  );
}

export function studentIsBlockedFromApplying(user, fundRecords, applications) {
  const received = studentHasReceivedScholarshipFund(
    user,
    fundRecords,
    applications,
    user.id
  );
  return received && user?.scholarshipReapplyAllowed !== true;
}

export function getStudentFundRecords(fundRecords, studentId) {
  return fundRecords
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => (b.fundReceivedAt || '').localeCompare(a.fundReceivedAt || ''));
}

export function getLatestFundRecord(fundRecords, applications, user, studentId) {
  const records = getStudentFundRecords(fundRecords, studentId);
  if (records.length > 0) return records[0];

  const app = applications?.find(
    (a) => a.studentId === studentId && a.fundStatus === 'received'
  );
  if (app) {
    return {
      scholarshipTitle: app.scholarshipTitle,
      fundReceivedAt: app.fundReceivedAt,
      fundSentAt: app.fundSentAt,
      applicationId: app.id,
      fromApplication: true,
    };
  }

  if (user?.hasReceivedScholarshipFund) {
    return {
      scholarshipTitle: user.lastReceivedScholarshipTitle || 'Scholarship program',
      fundReceivedAt: user.scholarshipFundReceivedAt,
      fromUser: true,
    };
  }

  return null;
}

export function buildFundRecordFromApplication(app, scholarship, student) {
  return {
    studentId: app.studentId,
    studentName: app.studentName || student?.name || '',
    studentEmail: app.studentEmail || student?.email || '',
    scholarshipId: app.scholarshipId,
    scholarshipTitle: app.scholarshipTitle,
    amount: scholarship?.amount ?? null,
    applicationId: app.id,
    fundSentAt: app.fundSentAt || null,
    fundReceivedAt: app.fundReceivedAt || new Date().toISOString().split('T')[0],
  };
}

/** Backfill fund records and user flags from existing applications (runs once on load). */
export function syncFundDataFromStorage({ KEYS, getItem, setItem, uid }) {
  const applications = getItem(KEYS.applications, []);
  const users = getItem(KEYS.users, []);
  const scholarships = getItem(KEYS.scholarships, []);
  let fundRecords = getItem(KEYS.fundRecords, []);
  let usersChanged = false;
  let recordsChanged = false;

  applications
    .filter((a) => a.fundStatus === 'received')
    .forEach((app) => {
      const student = users.find((u) => u.id === app.studentId);
      const scholarship = scholarships.find((s) => s.id === app.scholarshipId);

      if (!fundRecords.some((r) => r.applicationId === app.id)) {
        fundRecords = [
          {
            id: uid('fund'),
            ...buildFundRecordFromApplication(app, scholarship, student),
            recordedAt: app.fundReceivedAt || new Date().toISOString().split('T')[0],
          },
          ...fundRecords,
        ];
        recordsChanged = true;
      }

      const idx = users.findIndex((u) => u.id === app.studentId);
      if (idx !== -1 && !users[idx].hasReceivedScholarshipFund) {
        users[idx] = {
          ...users[idx],
          hasReceivedScholarshipFund: true,
          scholarshipReapplyAllowed: users[idx].scholarshipReapplyAllowed === true,
          scholarshipFundReceivedAt: app.fundReceivedAt || users[idx].scholarshipFundReceivedAt,
          lastReceivedScholarshipTitle: app.scholarshipTitle,
          lastReceivedScholarshipAmount: scholarship?.amount ?? null,
        };
        usersChanged = true;
      }
    });

  if (recordsChanged) setItem(KEYS.fundRecords, fundRecords);
  if (usersChanged) setItem(KEYS.users, users);
}
