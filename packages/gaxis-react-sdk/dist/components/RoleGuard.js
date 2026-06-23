import React from 'react';
import { useRoles } from '../hooks/useRoles';
import { Fragment as _Fragment, jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const RoleGuard = ({
  roles = [],
  children,
  fallback = null
}) => {
  const {
    hasRole
  } = useRoles();
  const isAuthorized = roles.some(role => hasRole(role));
  if (!isAuthorized) {
    return /*#__PURE__*/_jsxDEV(_Fragment, {
      children: fallback
    }, void 0, false);
  }
  return /*#__PURE__*/_jsxDEV(_Fragment, {
    children: children
  }, void 0, false);
};