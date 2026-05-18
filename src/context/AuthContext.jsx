import { createContext, useContext, useState, useEffect } from 'react';
import { KEYS, getItem, setItem, removeItem } from '../utils/storage';
import { seedDatabase } from '../utils/seedData';
import { getAccountStatus, requiresVerification, stripPassword } from '../utils/userHelpers';

const AuthContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (fullUser) => {
    const safe = stripPassword(fullUser);
    setUser(safe);
    setItem(KEYS.session, safe);
  };

  useEffect(() => {
    seedDatabase();
    const session = getItem(KEYS.session);
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = (email, password, role) => {
    const users = getItem(KEYS.users, []);
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === role
    );
    if (!found) {
      return { success: false, error: 'The email, password, or account type is incorrect.' };
    }
    const status = getAccountStatus(found);
    if (status === 'rejected') {
      return {
        success: false,
        error: 'Your account registration was not approved. Contact the administration for assistance.',
      };
    }
    persistSession(found);
    return { success: true, pending: status === 'pending' };
  };

  const register = (data) => {
    const users = getItem(KEYS.users, []);
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const role = data.role;
    const needsVerification = requiresVerification(role);

    const newUser = {
      id: uid('u'),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role,
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      accountStatus: needsVerification ? 'pending' : 'active',
      profileComplete: role === 'student',
      createdAt: new Date().toISOString().split('T')[0],
      ...(role === 'student' && {
        university: data.university?.trim() || '',
        major: data.major?.trim() || '',
        gpa: data.gpa?.trim() || '',
        dateOfBirth: data.dateOfBirth || '',
        studentId: data.studentId?.trim() || '',
      }),
      ...(role === 'admin' && {
        department: data.department?.trim() || '',
        organization: data.organization?.trim() || '',
      }),
      ...(role === 'institution' && {
        address: data.address?.trim() || '',
        contactPerson: data.contactPerson?.trim() || '',
      }),
      ...(needsVerification && {
        idProof: {
          fileName: data.idProofFileName,
          fileData: data.idProofFileData || null,
          mimeType: data.idProofMimeType || null,
          submittedAt: new Date().toISOString().split('T')[0],
          notes: data.idProofNotes?.trim() || '',
        },
      }),
    };

    users.push(newUser);
    setItem(KEYS.users, users);
    persistSession(newUser);

    return {
      success: true,
      pending: needsVerification,
    };
  };

  const logout = () => {
    setUser(null);
    removeItem(KEYS.session);
  };

  const updateProfile = (updates) => {
    const users = getItem(KEYS.users, []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;
    users[idx] = { ...users[idx], ...updates };
    setItem(KEYS.users, users);
    persistSession(users[idx]);
  };

  const refreshUser = () => {
    const session = getItem(KEYS.session);
    if (session) setUser(session);
  };

  const getPendingAccounts = () => {
    return getItem(KEYS.users, []).filter(
      (u) =>
        (u.role === 'admin' || u.role === 'institution') &&
        getAccountStatus(u) === 'pending'
    );
  };

  const reviewAccount = (userId, approved) => {
    const users = getItem(KEYS.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return;
    users[idx] = {
      ...users[idx],
      accountStatus: approved ? 'active' : 'rejected',
      reviewedAt: new Date().toISOString().split('T')[0],
    };
    setItem(KEYS.users, users);
    if (user?.id === userId && !approved) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        getPendingAccounts,
        reviewAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
