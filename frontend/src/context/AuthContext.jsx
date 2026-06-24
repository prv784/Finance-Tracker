import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) { try { setUser(JSON.parse(u)); } catch { localStorage.clear(); } }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, user: u } = res.data.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    toast.success(`Welcome back, ${u.firstName}!`);
    return u;
  }, []);

  const register = useCallback(async data => {
    const res = await authAPI.register(data);
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const res = await authAPI.verifyOtp(email, otp);
    const { accessToken, user: u } = res.data.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    toast.success('Account verified! Welcome aboard 🎉');
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
