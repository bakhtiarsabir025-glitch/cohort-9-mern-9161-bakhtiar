import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, signup as signupApi } from '../api/auth';
import client from '../api/client'; // Import client to handle global setup if needed, or we just rely on localStorage

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If we have a token, we could optionally fetch the current user profile here.
    // Since the API response format for login/signup includes the user object,
    // we might lose the user object on refresh if there's no /me endpoint.
    // For now, we'll just rely on the token for authentication status.
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    }
    setIsLoading(false);

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    const accessToken = data.session?.access_token;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    }
    return data;
  };

  const signup = async (email, password) => {
    const data = await signupApi(email, password);
    const accessToken = data.session?.access_token;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
