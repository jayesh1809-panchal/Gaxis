import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Fragment as _Fragment, jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const ProtectedRoute = ({
  children
}) => {
  const {
    isAuthenticated,
    login
  } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) {
      login(); // Automatically trigger login flow if not authenticated
    }
  }, [isAuthenticated, login]);
  if (!isAuthenticated) {
    // Optionally return a loading spinner or null while redirecting
    return null;
  }
  return /*#__PURE__*/_jsxDEV(_Fragment, {
    children: children
  }, void 0, false);
};