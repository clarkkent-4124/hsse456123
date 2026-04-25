import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminPage({ user }) {
  const [triggerDuration, setTriggerDuration] = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.getSettings()
      .then(data => {
        if (data.trigger_duration !== undefined) setTriggerDuration(data.trigger_duration);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (triggerDuration === '' || isNaN(Number(triggerDuration)) || Number(triggerDuration) < 1) {
      setError('Masukkan durasi yang valid (angka ≥ 1).');
      return;
    }
    setError('');
    setSaving(true);
    setShowProgress(true);
    setSaved(false);
    const startTime = Date.now();
    let isError = false;
    try {
      await api.saveSettings({ trigger_duration: Number(triggerDuration) });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
      isError = true;
    } finally {
      const remaining = Math.max(0, 1000 - (Date.now() - startTime));
      setTimeout(() => {
        setSaving(false);
        setShowProgress(false);
        if (!isError) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }, remaining);
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Panel Admin</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.2 }}>Login sebagai: {user?.username}</div>
        </div>
      </div>

      {/* Settings card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{
          height: 3,
          background: 'var(--border)',
          overflow: 'hidden',
          opacity: showProgress ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          <div
            className="progress-sweep"
            style={{
              width: '25%', height: '100%',
              background: 'linear-gradient(90deg, transparent, #a855f7, #7c3aed, transparent)',
              borderRadius: 2,
            }}
          />
        </div>

        <div style={{ padding: '18px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
          Pengaturan Sistem
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '40%', height: 10 }} />
            <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 8 }} />
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            style={{
              display: 'flex', flexDirection: 'column', gap: 16,
              opacity: saving ? 0.55 : 1,
              transition: 'opacity 0.25s',
              pointerEvents: saving ? 'none' : 'auto',
            }}
          >
            {/* Trigger Duration */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Trigger Duration
                <span style={{ fontWeight: 400, color: 'var(--dim)', marginLeft: 4 }}>(detik)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={triggerDuration}
                  onChange={e => { setTriggerDuration(e.target.value); setError(''); setSaved(false); }}
                  placeholder="Contoh: 30"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 44px 10px 14px',
                    color: 'var(--text)', fontSize: 15,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600, outline: 'none',
                  }}
                />
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, color: 'var(--dim)', fontFamily: 'IBM Plex Sans, sans-serif',
                }}>
                  detik
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 5 }}>
                Durasi minimal alarm aktif sebelum dianggap sebagai trigger.
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: '#ef4444',
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {saved && (
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: '#22c55e',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Pengaturan berhasil disimpan.
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving
                  ? 'linear-gradient(135deg, #7c3aed99, #6d28d999)'
                  : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none', borderRadius: 10,
                padding: '11px 0', width: '100%',
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'IBM Plex Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saving ? 0.85 : 1,
                transition: 'background 0.2s, opacity 0.2s',
              }}
            >
              {saving ? (
                <>
                  <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Simpan Pengaturan
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
