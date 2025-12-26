// src/shared/hooks/useAuth.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { MOCK_USERS } from '../utils/mockData';
import { loginUser, getCurrentUser } from '../../features/auth/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock user in localStorage (dev mode)
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }

    // Check if user is logged in (check token in localStorage)
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // Handle mock tokens
      if (token.startsWith('mock-token')) {
        const userType = token.replace('mock-token-', '');
        setUser(MOCK_USERS[userType]);
        return;
      }

      // Real API call
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      localStorage.removeItem('authToken');
      localStorage.removeItem('mockUser');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { user, token } = await loginUser(credentials);
      localStorage.setItem('authToken', token);
      // We don't store user in localStorage for real auth, we rely on state/fetching
      // But for consistency with how the app might be using it elsewhere or for persistence across reloads without refetching immediately (optional)
      // For now, let's just set state.
      setUser(user);
      return { user, token };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
