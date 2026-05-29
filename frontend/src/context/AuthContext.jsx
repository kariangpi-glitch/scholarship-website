import { createContext, useContext, useState, useEffect } from 'react';
import { KEYS, getItem, setItem, removeItem } from '../utils/storage';
import { getAccountStatus } from '../utils/userHelpers';

const AuthContext = createContext(null);

const API_URL = 'http://127.0.0.1:5050';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (fullUser) => {
    setUser(fullUser);
    setItem(KEYS.session, fullUser);
  };

  useEffect(() => {
    const session = getItem(KEYS.session);
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        return {
          success: false,
          error: 'The email, password, or account type is incorrect.',
        };
      }

      const found = await res.json();

      const status = getAccountStatus(found);

      if (status === 'rejected') {
        return {
          success: false,
          error:
            'Your account registration was not approved. Contact the administration for assistance.',
        };
      }

      persistSession(found);

      return {
        success: true,
        pending: status === 'pending',
      };
    } catch (err) {
      return {
        success: false,
        error: 'Backend connection failed. Make sure backend is running.',
      };
    }
  };

  const register = async (data) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!res.ok) {
        return {
          success: false,
          error: 'Registration failed.',
        };
      }
  
      const newUser = await res.json();
  
      persistSession(newUser);
  
      return {
        success: true,
        pending: newUser.accountStatus === 'pending',
      };
    } catch (err) {
      return {
        success: false,
        error: 'Backend connection failed. Make sure backend is running.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    removeItem(KEYS.session);
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setItem(KEYS.session, updatedUser);
  };

  const refreshUser = () => {
    const session = getItem(KEYS.session);
    if (session) setUser(session);
  };

  const getPendingAccounts = () => {
    return [];
  };

  const reviewAccount = () => {};

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
