const KEYS = {
  users: 'sh_users',
  scholarships: 'sh_scholarships',
  applications: 'sh_applications',
  documents: 'sh_documents',
  announcements: 'sh_announcements',
  notifications: 'sh_notifications',
  fundRecords: 'sh_fund_records',
  session: 'sh_session',
  seeded: 'sh_seeded',
};

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export { KEYS };
