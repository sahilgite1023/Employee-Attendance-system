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
      const token = Cookies.get('token');
      const savedUser = Cookies.get('user');
      
      if (token && savedUser) {
        // Set user from cookie immediately for instant UI
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
        // Set loading false immediately — don't wait for network
        setLoading(false);
        
        // Background verification (non-blocking)
        authAPI.getMe()
          .then((response) => {
            if (response.data) {
              setUser(response.data);
              Cookies.set('user', JSON.stringify(response.data), { expires: 7 });
            }
          })
          .catch(() => {
            console.warn('Background auth verification failed, using cached data');
          });
        return; // skip finally setLoading
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    setLoading(false);
  };

  const login = async (employeeId, password, rememberMe = false) => {
    const response = await authAPI.login({ employeeId, password });
    const { token, user } = response.data;

    // Set cookie expiration based on "Remember me" checkbox
    // If "Remember me" is checked: 30 days, otherwise: 1 day (session-like)
    const cookieExpiration = rememberMe ? 30 : 1;

    Cookies.set('token', token, { expires: cookieExpiration });
    Cookies.set('user', JSON.stringify(user), { expires: cookieExpiration });
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
      Cookies.remove('token');
      Cookies.remove('user');
      setUser(null);
      // Note: We don't remove 'rememberedEmployeeId' and 'rememberMe' from localStorage
      // so that the employee ID can be auto-filled on next login if they want
      router.push('/login');
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
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
