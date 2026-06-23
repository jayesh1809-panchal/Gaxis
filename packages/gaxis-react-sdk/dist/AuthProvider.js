import React, { createContext, useState, useEffect } from 'react';
import { authService } from './services/authService';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const AuthContext = /*#__PURE__*/createContext();
export const AuthProvider = ({
  children,
  config,
  initialUser,
  initialSessionId
}) => {
  const [user, setUser] = useState(initialUser || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialUser);
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const login = () => {
    authService.login(config.baseUrl, config.loginUrl);
  };
  const logout = async () => {
    if (sessionId) {
      await authService.logout(config.baseUrl, sessionId);
    }
    setUser(null);
    setIsAuthenticated(false);
    setSessionId(null);
    if (config.onLogout) {
      config.onLogout();
    }
  };
  const forceLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setSessionId(null);
    if (config.onLogout) {
      config.onLogout();
    }
  };
  return /*#__PURE__*/_jsxDEV(AuthContext.Provider, {
    value: {
      user,
      isAuthenticated,
      sessionId,
      login,
      logout,
      forceLogout,
      setUser,
      setIsAuthenticated,
      setSessionId
    },
    children: children
  }, void 0, false);
};