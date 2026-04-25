import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const TYPE_CHIPS = ['Semua', 'PICKUP', 'RNR', 'TCS'];

const TYPE_STYLE = {
  PICKUP: { colorVar: 'var(--pickup)', bgVar: 'var(--pickup-bg)', borderVar: 'var(--pickup-border)' },
  RNR:    { colorVar: 'var(--rnr)',    bgVar: 'var(--rnr-bg)',    borderVar: 'var(--rnr-border)'    },
  TCS:    { colorVar: 'var(--tcs)',    bgVar: 'var(--tcs-bg)',    borderVar: 'var(--tcs-border)'    },
  OTHER:  { colorVar: 'var(--muted)',  bgVar: 'var(--surface2)',  borderVar: 'var(--border)'        },
};

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function AlarmPage() {
  const [activeChip, setActiveChip] = useState('Semua');
  const [alarms, setAlarms]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAlarms = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      if (activeChip !== 'Semua') params.jenis = activeChip;
      const res = await api.getLiveAlarms(params);
      setAlarms(res.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Gagal memuat data. Periksa koneksi backend.');
    } finally {
      setLoading(false);
    }
  }, [activeChip]);

  // Fetch on mount & chip change
  useEffect(() => {
    setLoading(true);
    fetchAlarms();
  }, [fetchAlarms]);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(fetchAlarms, 30000);
    return () => clearInterval(timer);
  }, [fetchAlarms]);

  const counts = {
    PICKUP: alarms.filter(a => a.jenis === 'PICKUP').length,
    RNR:    alarms.filter(a => a.jenis === 'RNR').length,
    TCS:    alarms.filter(a => a.jenis === 'TCS').length,
  };

  const displayed = activeChip === 'Semua' ? alarms : alarms.filter(a => a.jenis === activeChip);

  return (
    <div className="fade-in">

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Live Alarm</div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
            {loading ? 'Memuat...' : `${displayed.length} alarm aktif saat ini`}
          </div>
        </div>
        {/* Refresh button */}
        <button
          onClick={() => { setLoading(true); fetchAlarms(); }}
          title="Refresh"
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Count summary mini cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(counts).map(([type, count]) => {
          const s = TYPE_STYLE[type];
          return (
            <div key={type} style={{
              flex: 1, background: s.bgVar, border: `1px solid ${s.borderVar}`,
              borderRadius: 10, padding: '8px 0', textAlign: 'center',
            }}>
              <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: s.colorVar }}>{count}</div>
              <div style={{ fontSize: 10, color: s.colorVar, fontWeight: 600, marginTop: 2 }}>{type}</div>
            </div>
          );
        })}
      </div>

      {/* Type filter chips */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 12px',
      }}>
        {TYPE_CHIPS.map(chip => {
          const active = activeChip === chip;
          const s = chip !== 'Semua' ? TYPE_STYLE[chip] : null;
          return (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              style={{
                background: active ? (s ? s.bgVar : 'var(--accent-bg)') : 'transparent',
                color:      active ? (s ? s.colorVar : 'var(--accent)') : 'var(--dim)',
                border: `1px solid ${active ? (s ? s.colorVar : 'var(--accent)') : 'var(--border)'}`,
                borderRadius: 20, padding: '4px 14px', fontSize: 12,
                fontWeight: active ? 700 : 400, cursor: 'pointer',
                fontFamily: 'IBM Plex Sans, sans-serif', transition: 'all 0.15s',
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'var(--pickup-bg)', border: '1px solid var(--pickup-border)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 12,
          fontSize: 13, color: 'var(--pickup)', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Alarm list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 64px',
          padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
        }}>
          {['#', 'GI / Feeder / Point', 'Waktu'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 64px',
              padding: '12px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 0,
            }}>
              <div style={{ width: 20, height: 8, background: 'var(--surface2)', borderRadius: 4 }} />
              <div>
                <div style={{ width: '60%', height: 10, background: 'var(--surface2)', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '40%', height: 8, background: 'var(--surface2)', borderRadius: 4 }} />
              </div>
              <div style={{ width: 40, height: 8, background: 'var(--surface2)', borderRadius: 4 }} />
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
            {error ? 'Tidak dapat memuat data' : 'Tidak ada alarm aktif'}
          </div>
        ) : displayed.map((alarm, i) => {
          const s = TYPE_STYLE[alarm.jenis] || TYPE_STYLE.OTHER;
          const tglPickup = formatDate(alarm.timestamp);
          const jamPickup = formatTime(alarm.timestamp);
          return (
            <div
              key={alarm.id}
              style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 64px',
                padding: '10px 14px',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* No + pulsing dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--dim)' }}>
                  {String(i + 1).padStart(3, '0')}
                </span>
                <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: s.colorVar }} />
              </div>

              {/* Info */}
              <div style={{ minWidth: 0, paddingRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    background: s.bgVar, color: s.colorVar,
                    border: `1px solid ${s.colorVar}44`,
                    borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700, flexShrink: 0,
                  }}>
                    {alarm.jenis}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {alarm.gi_name || alarm.gi_code}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {alarm.feeder_name || alarm.feeder_code}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--dim)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1,
                }}>
                  {alarm.point_text}
                </div>
              </div>

              {/* Time */}
              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{jamPickup}</div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{tglPickup}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last update info */}
      {lastUpdate && !loading && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--dim)' }}>
          Update terakhir: {formatTime(lastUpdate.toISOString())} · auto-refresh 30s
        </div>
      )}
    </div>
  );
}
