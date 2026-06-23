import { useContext } from 'react';
import { GAxisContext } from '../GAxisProvider';
export const useGAxis = () => {
  const context = useContext(GAxisContext);
  if (!context) {
    throw new Error('useGAxis must be used within a GAxisProvider');
  }
  return context;
};