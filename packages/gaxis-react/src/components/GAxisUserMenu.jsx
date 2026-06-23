import React, { useState, useRef, useEffect } from 'react';
import { useGAxis } from '../hooks/useGAxis';

export const GAxisUserMenu = ({ className = "", style = {} }) => {
    const { user, tenant, logout, isAuthenticated, isLoading } = useGAxis();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />;
    }

    if (!isAuthenticated || !user) {
        return null; // Should not render if not logged in
    }

    const initials = user.firstName && user.lastName 
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || "U";

    const defaultContainerStyle = {
        position: 'relative',
        display: 'inline-block'
    };

    const defaultAvatarStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        cursor: 'pointer',
        userSelect: 'none',
        border: 'none'
    };

    const defaultDropdownStyle = {
        position: 'absolute',
        right: '0',
        marginTop: '0.5rem',
        width: '240px',
        backgroundColor: 'white',
        borderRadius: '0.375rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        zIndex: 50,
        padding: '0.5rem 0',
        display: isOpen ? 'block' : 'none'
    };

    return (
        <div 
            ref={menuRef}
            className={className} 
            style={className ? style : { ...defaultContainerStyle, ...style }}
        >
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={defaultAvatarStyle}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {initials}
            </button>

            <div style={defaultDropdownStyle}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
                        {user.firstName} {user.lastName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                    </p>
                    {tenant && (
                        <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.125rem 0.375rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '500' }}>
                            {tenant}
                        </span>
                    )}
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                    <button 
                        onClick={logout}
                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};
