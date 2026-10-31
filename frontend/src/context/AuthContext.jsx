import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, login as loginRequest, register as registerRequest } from "../api/client";


const TOKEN_KEY = "alm-access-token";
const LEGACY_HISTORY_KEY = "alm-report-history-v1";
const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_HISTORY_KEY);
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener("alm-auth-expired", handleExpired);
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return () => window.removeEventListener("alm-auth-expired", handleExpired);
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener("alm-auth-expired", handleExpired);
  }, []);

  const authenticate = async (request, credentials) => {
    const response = await request(credentials);
    window.localStorage.setItem(TOKEN_KEY, response.access_token);
    window.localStorage.removeItem(LEGACY_HISTORY_KEY);
    setUser(response.user);
    return response.user;
  };

  const value = useMemo(() => ({
    user,
    loading,
    login: (credentials) => authenticate(loginRequest, credentials),
    register: (credentials) => authenticate(registerRequest, credentials),
    logout: () => {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(LEGACY_HISTORY_KEY);
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
