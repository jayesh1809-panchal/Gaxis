import React, { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export const SessionTimeout = ({
  warningMinutes = 5,
  onTimeoutWarning
}) => {
  const {
    expiresAt
  } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  useEffect(() => {
    if (!expiresAt) return;
    const checkInterval = setInterval(() => {
      const now = new Date();
      const diffMs = expiresAt - now;
      const diffMinutes = diffMs / 1000 / 60;
      if (diffMinutes <= warningMinutes && diffMinutes > 0) {
        setShowWarning(true);
        if (onTimeoutWarning) onTimeoutWarning(diffMinutes);
      } else {
        setShowWarning(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [expiresAt, warningMinutes, onTimeoutWarning]);
  if (!showWarning) return null;
  return /*#__PURE__*/_jsxDEV("div", {
    className: "gaxis-session-warning",
    children: "Your session is about to expire. Please save your work."
  }, void 0, false);
};