export function getAccountStatus(user) {
  return user?.accountStatus || 'active';
}

export function isAccountActive(user) {
  return getAccountStatus(user) === 'active';
}

export function isAccountPending(user) {
  return getAccountStatus(user) === 'pending';
}

export function requiresVerification(role) {
  return role === 'admin' || role === 'institution';
}

export function stripPassword(user) {
  const { password: _, ...safe } = user;
  return safe;
}
