/**
 * NavBar — Top navigation for Alpha Terminal
 * Links to all major pages. Active page highlighted.
 */

import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/agent-x', label: 'Agent X', icon: '🧠' },
    { path: '/feds', label: 'The Feds', icon: '🏦' },
    { path: '/politicians', label: 'Politicians', icon: '🏛️' },
    { path: '/exploit', label: 'Exploit', icon: '🐺' },
    { path: '/axlfi', label: 'AXLFI Intel', icon: '🛰️' },
];

export function NavBar() {
    const location = useLocation();

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 45, 0.9))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginRight: '2rem',
            }}>
                <span style={{ fontSize: '1.25rem' }}>🔥</span>
                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    ALPHA TERMINAL
                </span>
            </div>

            {/* Nav Links */}
            {NAV_ITEMS.map(item => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 0.875rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.8125rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#e2e8f0' : 'rgba(148, 163, 184, 0.8)',
                            background: isActive
                                ? 'rgba(139, 92, 246, 0.15)'
                                : 'transparent',
                            border: isActive
                                ? '1px solid rgba(139, 92, 246, 0.3)'
                                : '1px solid transparent',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
                                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                (e.target as HTMLElement).style.color = '#cbd5e1';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
                                (e.target as HTMLElement).style.background = 'transparent';
                                (e.target as HTMLElement).style.color = 'rgba(148, 163, 184, 0.8)';
                            }
                        }}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
