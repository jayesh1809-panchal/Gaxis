import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Fragment as _Fragment, jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const PermissionGuard = ({
  permission,
  permissions = [],
  children,
  fallback = null
}) => {
  const {
    hasPermission
  } = usePermissions();
  const permsToCheck = permission ? [permission] : permissions;
  const isAuthorized = permsToCheck.some(p => hasPermission(p));
  if (!isAuthorized) {
    return /*#__PURE__*/_jsxDEV(_Fragment, {
      children: fallback
    }, void 0, false);
  }
  return /*#__PURE__*/_jsxDEV(_Fragment, {
    children: children
  }, void 0, false);
};