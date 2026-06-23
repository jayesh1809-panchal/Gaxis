import React, { createContext, useState } from 'react';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const RBACContext = /*#__PURE__*/createContext();
export const RBACProvider = ({
  children,
  initialRoles = [],
  initialPermissions = []
}) => {
  const [roles, setRoles] = useState(initialRoles);
  const [permissions, setPermissions] = useState(initialPermissions);
  const hasRole = role => {
    return roles.includes(role);
  };
  const hasPermission = permission => {
    return permissions.includes(permission);
  };
  const can = permission => hasPermission(permission);
  return /*#__PURE__*/_jsxDEV(RBACContext.Provider, {
    value: {
      roles,
      permissions,
      hasRole,
      hasPermission,
      can,
      setRoles,
      setPermissions
    },
    children: children
  }, void 0, false);
};