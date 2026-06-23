import React, { createContext } from 'react';
import { AuthProvider } from './AuthProvider';
import { SessionProvider } from './SessionProvider';
import { RBACProvider } from './RBACProvider';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const GAxisContext = /*#__PURE__*/createContext();

/**
 * The master context provider for G-Axis.
 * @param {Object} config - { baseUrl, loginUrl, onLogout }
 * @param {Object} initialState - { user, sessionId, roles, permissions, expiresInSeconds }
 */
export const GAxisProvider = ({
  children,
  config,
  initialState = {}
}) => {
  if (!config || !config.baseUrl) {
    console.error('GAxisProvider requires a config.baseUrl');
  }
  return /*#__PURE__*/_jsxDEV(GAxisContext.Provider, {
    value: {
      config
    },
    children: /*#__PURE__*/_jsxDEV(AuthProvider, {
      config: config,
      initialUser: initialState.user,
      initialSessionId: initialState.sessionId,
      children: /*#__PURE__*/_jsxDEV(SessionProvider, {
        config: config,
        initialExpiresInSeconds: initialState.expiresInSeconds,
        children: /*#__PURE__*/_jsxDEV(RBACProvider, {
          initialRoles: initialState.roles,
          initialPermissions: initialState.permissions,
          children: children
        }, void 0, false)
      }, void 0, false)
    }, void 0, false)
  }, void 0, false);
};