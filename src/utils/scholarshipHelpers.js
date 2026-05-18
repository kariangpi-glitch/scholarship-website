export function isScholarshipVisible(sch) {
  if (sch.status !== 'active') return false;
  if (sch.approvalStatus === 'pending') return false;
  return true;
}

export function isPendingInstitutionScholarship(sch) {
  return sch.approvalStatus === 'pending' && sch.institutionId;
}

/** Institution program is live (approved or legacy active) — not awaiting admin approval. */
export function isInstitutionProgramLive(sch) {
  if (!sch.institutionId) return false;
  if (sch.approvalStatus === 'pending') return false;
  if (sch.status === 'inactive') return false;
  if (sch.approvalStatus === 'approved') return true;
  // Legacy entries: active but no approvalStatus field yet
  if (sch.status === 'active') return true;
  return false;
}

export function filterInstitutionPrograms(scholarships, institutionId) {
  return scholarships.filter((s) => s.institutionId === institutionId);
}

export function getLiveInstitutionPrograms(scholarships, institutionId) {
  return filterInstitutionPrograms(scholarships, institutionId).filter(isInstitutionProgramLive);
}

export function getPendingInstitutionPrograms(scholarships, institutionId) {
  return filterInstitutionPrograms(scholarships, institutionId).filter(isPendingInstitutionScholarship);
}
