const React = require('react');
const {
  createContext,
  useContext,
  useState,
  useEffect
} = require('react');
const GAxisContext = createContext(null);

/**
 * React Provider for G-Axis SDK Integration
 * Wraps the frontend application and provides authentication state.
 */
function GAxisProvider({
  children,
  config
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  useEffect(() => {
    // In a real frontend implementation, we would extract the token from URL parameters (if just redirected from G-Axis via Backend-For-Frontend),
    // or from localStorage, and set the user session.
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      // Clean token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // In a production setup, we would fetch user info here using the token or decode it.
      // Simplified mock for SDK skeleton:
      setUser({
        id: 'mock-user-123',
        name: 'G-Axis User',
        roles: ['EMPLOYEE'],
        permissions: ['dashboard.view']
      });
    }
    setLoading(false);
  }, []);
  const login = () => {
    if (config.loginUrl) {
      window.location.href = config.loginUrl;
    }
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    if (config.logoutUrl) {
      window.location.href = config.logoutUrl;
    }
  };
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
  return React.createElement(GAxisContext.Provider, {
    value
  }, !loading && children);
}

/**
 * Custom hook to access G-Axis auth state
 */
function useGAxis() {
  const context = useContext(GAxisContext);
  if (!context) {
    throw new Error('useGAxis must be used within a GAxisProvider');
  }
  return context;
}

/**
 * Custom hook for Role Based Access Control
 */
function useRoles() {
  const {
    user
  } = useGAxis();
  const hasRole = role => {
    return user?.roles?.includes(role) || false;
  };
  return {
    hasRole,
    roles: user?.roles || []
  };
}

/**
 * Custom hook for Permission Based Access Control
 */
function usePermissions() {
  const {
    user
  } = useGAxis();
  const hasPermission = permission => {
    return user?.permissions?.includes(permission) || false;
  };
  return {
    hasPermission,
    permissions: user?.permissions || []
  };
}

/**
 * Protected Route Wrapper Component
 */
function ProtectedRoute({
  children,
  fallback = null
}) {
  const {
    isAuthenticated,
    loading,
    login
  } = useGAxis();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      login(); // Auto trigger login if not authenticated
    }
  }, [isAuthenticated, loading, login]);
  if (loading) return null;
  if (!isAuthenticated) {
    return fallback;
  }
  return children;
}
module.exports = {
  GAxisProvider,
  useGAxis,
  useRoles,
  usePermissions,
  ProtectedRoute
};