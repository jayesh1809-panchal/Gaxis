import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const LogoutButton = ({
  className,
  children
}) => {
  const {
    logout
  } = useAuth();
  return /*#__PURE__*/_jsxDEV("button", {
    className: className,
    onClick: logout,
    children: children || 'Logout'
  }, void 0, false);
};