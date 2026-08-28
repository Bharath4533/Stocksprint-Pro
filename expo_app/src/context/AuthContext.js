import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt instant demo login by default for immediate trading
    handleDemoLogin();
  }, []);

  const handleDemoLogin = async () => {
    try {
      const res = await api.post('/auth/demo');
      if (res.token) {
        api.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Demo login note:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.token) {
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error('Login failed');
  };

  const registerWithPassword = async (name, phone, email, password) => {
    const res = await api.post('/auth/register', { name, phone, email, password });
    if (res.token) {
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.user) {
        setUser(res.user);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      loginWithPassword,
      registerWithPassword,
      handleDemoLogin,
      logout,
      refreshUser,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
