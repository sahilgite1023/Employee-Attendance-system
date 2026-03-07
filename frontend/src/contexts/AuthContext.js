'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try cookie first, then localStorage fallback
      let token = Cookies.get('token');
      let savedUser = Cookies.get('user');

      // Fallback: restore from localStorage if cookies are missing
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
        savedUser = localStorage.getItem('authUser');
        // Re-sync back to cookies if found in localStorage
        if (token && savedUser) {
          Cookies.set('token', token, { expires: 7 });
          Cookies.set('user', savedUser, { expires: 7 });
        }
      }
      
      if (token && savedUser) {
        // Set user from saved data immediately for instant UI
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
          clearAuthData();
          setLoading(false);
          return;
        }
        // Set loading false immediately — don't wait for network
        setLoading(false);
        
        // Background verification (non-blocking)
        authAPI.getMe()
          .then((response) => {
            if (response.data) {
              setUser(response.data);
              persistAuthUser(response.data);
            }
          })
          .catch((err) => {
            // Only clear if it's a definitive 401, not a network error
            if (err?.response?.status === 401 || err?.status === 401) {
              clearAuthData();
              setUser(null);
            }
            // For network errors, keep using cached data
          });
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    setLoading(false);
  };

  /** Persist auth data to both cookies and localStorage */
  const persistAuthData = (token, userData, expireDays = 7) => {
    Cookies.set('token', token, { expires: expireDays });
    Cookies.set('user', JSON.stringify(userData), { expires: expireDays });
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));
    }
  };

  /** Persist just the user data (e.g. after background refresh) */
  const persistAuthUser = (userData) => {
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    if (typeof window !== 'undefined') {
      localStorage.setItem('authUser', JSON.stringify(userData));
    }
  };

  /** Clear all auth data from cookies and localStorage */
  const clearAuthData = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  };

  const login = async (employeeId, password, rememberMe = false) => {
    const response = await authAPI.login({ employeeId, password });
    const { token, user } = response.data;

    // Set expiration based on "Remember me" checkbox
    const cookieExpiration = rememberMe ? 30 : 1;

    persistAuthData(token, user, cookieExpiration);
    setUser(user);

    // Redirect based on role — use replace to avoid back-button loop
    if (user.role === 'admin' || user.role === 'hr') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/dashboard');
    }

    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    persistAuthUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
