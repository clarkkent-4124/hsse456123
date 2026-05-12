import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [notice, setNotice]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    if (!username.trim() || !password.trim()) {
      setNotice({ type: 'error', message: 'Username dan password wajib diisi.' });
      return;
    }

    try {
      await login(username.trim(), password);
      setNotice({ type: 'success', message: 'Login berhasil. Mengalihkan ke dashboard...' });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const message = err?.message === 'Network Error'
        ? 'Tidak bisa terhubung ke backend. Periksa koneksi API, CORS, atau server backend.'
        : (err?.message || 'Username atau password salah.');
      setNotice({ type: 'error', message });
    }
  }

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      {/* Theme toggle — top right */}
      <button
        className="theme-toggle"
        onClick={toggle}
        style={{ position: 'absolute', top: 20, right: 20 }}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
        }} />
      </div>

      {/* Login card */}
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Card header / brand */}
        <div style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          background: 'var(--surface2)',
        }}>
          {/* Shield icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34,211,238,0.25)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.5px',
            }}>
              HSSE UP2D Jateng
            </h1>
            <p style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: 'var(--muted)',
            }}>
              Sistem Pelaporan &amp; Pengawasan
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.3px',
              }}>
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--dim)', display: 'flex', alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.3px',
              }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--dim)', display: 'flex', alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
                {/* Show/hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--dim)', padding: 4, display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim)'; }}
                >
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login notification */}
            {notice && (
              <div className="fade-in" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                background: notice.type === 'success' ? 'rgba(16,185,129,0.12)' : 'var(--tidak-aman-bg)',
                border: `1px solid ${notice.type === 'success' ? 'rgba(16,185,129,0.35)' : 'var(--tidak-aman-border)'}`,
                borderRadius: 8,
                fontSize: 12,
                color: notice.type === 'success' ? '#10b981' : 'var(--tidak-aman)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  {notice.type === 'success' ? (
                    <>
                      <path d="M20 6 9 17l-5-5" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </>
                  )}
                </svg>
                {notice.message}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 4,
                background: loading
                  ? 'var(--surface2)'
                  : 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: 9,
                color: loading ? 'var(--muted)' : 'white',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.15s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ borderTopColor: 'var(--muted)', borderColor: 'var(--border)' }} />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Masuk
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--dim)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        HSSE UP2D Jateng &mdash; Sistem Pelaporan Pengawasan Keselamatan Kerja
      </p>
    </div>
  );
}
