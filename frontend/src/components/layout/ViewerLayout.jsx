import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ViewerLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div
      data-theme={theme}
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100dvh',
        position: 'relative',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Fixed header */}
        <header style={{
          position: 'fixed',
          top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          zIndex: 100,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Logo */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              HSSE Dashboard
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)' }}>Pelaporan & Pengawasan</div>
          </div>

          {/* User label */}
          {user && (
            <div style={{
              fontSize: 11, color: 'var(--muted)',
              background: 'var(--surface2)',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}>
              {user.nama || user.username}
            </div>
          )}

          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle} style={{ padding: '4px 8px' }}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* Content */}
        <main style={{ paddingTop: 64, paddingBottom: 72, flex: 1 }}>
          <Outlet />
        </main>

        {/* Bottom nav */}
        <nav style={{
          position: 'fixed',
          bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          zIndex: 100,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <button
            style={{
              flex: 1, padding: '10px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            style={{
              flex: 1, padding: '10px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 10,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar
          </button>
        </nav>
      </div>
    </div>
  );
}
