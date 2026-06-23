import React from 'react';
import { useGAxis } from '../hooks/useGAxis';

const baseButtonStyles = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const primaryButtonStyles = {
    ...baseButtonStyles,
    backgroundColor: '#2563eb',
    color: '#ffffff',
};

const disabledButtonStyles = {
    ...baseButtonStyles,
    backgroundColor: '#93c5fd',
    color: '#ffffff',
    cursor: 'not-allowed',
};

export const GAxisLoginButton = ({ 
    className = "", 
    style = {}, 
    children = "Login with G-Axis" 
}) => {
    const { login, isLoading, error } = useGAxis();

    const currentStyle = isLoading ? disabledButtonStyles : primaryButtonStyles;
    
    // Allow users to completely override classes via tailwind/css or merge styles
    const mergedStyle = className ? style : { ...currentStyle, ...style };

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
                onClick={login} 
                disabled={isLoading}
                className={className}
                style={mergedStyle}
            >
                {isLoading ? "Loading..." : children}
            </button>
            {error && (
                <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{error}</span>
            )}
        </div>
    );
};
