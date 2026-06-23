import { useContext } from 'react';
import { AuthContext } from '../AuthProvider';
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    login: context.login,
    logout: context.logout
  };
};