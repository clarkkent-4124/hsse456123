import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const TYPE_STYLE = {
  PICKUP: { colorVar: 'var(--pickup)', bgVar: 'var(--pickup-bg)' },
  RNR:    { colorVar: 'var(--rnr)',    bgVar: 'var(--rnr-bg)'    },
  TCS:    { colorVar: 'var(--tcs)',    bgVar: 'var(--tcs-bg)'    },
  OTHER:  { colorVar: 'var(--muted)',  bgVar: 'var(--surface2)'  },
};

const CHIPS = ['Semua', 'PICKUP', 'RNR', 'TCS'];
const PAGE_SIZE = 8;

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export default function AlarmDetail({ initialFilter, onBack, showBackButton = true }) {
  const today        = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [search, setSearch]         = useState('');
  const [dari, setDari]             = useState(sevenDaysAgo);
  const [sampai, setSampai]         = useState(today);
  const [activeChip, setActiveChip] = useState(
    initialFilter && initialFilter !== 'TOTAL' ? initialFilter : 'Semua'
  );
  const [selectedGI, setSelectedGI] = useState('Semua GI');
  const [giOptions, setGiOptions]   = useState([]);
  const [page, setPage]             = useState(1);

  const [alarms, setAlarms]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Fetch GI list once
  useEffect(() => {
    api.getGIList()
      .then(res => setGiOptions(res.data || []))
      .catch(() => {});
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        dari,
        sampai,
        page,
        limit: PAGE_SIZE,
      };
      if (activeChip !== 'Semua') params.jenis = activeChip;
      if (selectedGI !== 'Semua GI') params.gi = selectedGI;
      if (search) params.search = search;

      const res = await api.getHistory(params);
      setAlarms(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError('Gagal memuat data. Periksa koneksi backend.');
    } finally {
      setLoading(false);
    }
  }, [dari, sampai, activeChip, selectedGI, search, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function handleChip(chip)   { setActiveChip(chip); setPage(1); }
  function handleGI(gi)       { setSelectedGI(gi);   setPage(1); }
  function handleSearch(v)    { setSearch(v);         setPage(1); }
  function handleDari(v)      { setDari(v);           setPage(1); }
  function handleSampai(v)    { setSampai(v);         setPage(1); }

  const title = activeChip === 'Semua' ? 'History Alarm' : `History ${activeChip}`;

  return (
    <div className="fade-in">

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', color: 'var(--text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontFamily: 'IBM Plex Sans, sans-serif', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Kembali
          </button>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
            {loading ? 'Memuat...' : `${total} record ditemukan`}
          </div>
        </div>
      </div>

      {/* Filter card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '12px', marginBottom: 12,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari GI, feeder, point..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={dari}   onChange={e => handleDari(e.target.value)}   style={{ flex: 1 }} />
          <span style={{ color: 'var(--dim)', flexShrink: 0 }}>—</span>
          <input type="date" value={sampai} onChange={e => handleSampai(e.target.value)} style={{ flex: 1 }} />
        </div>

        {/* GI filter dropdown */}
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <select
            value={selectedGI}
            onChange={e => handleGI(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface2)',
              color: selectedGI === 'Semua GI' ? 'var(--dim)' : 'var(--text)',
              border: `1px solid ${selectedGI !== 'Semua GI' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8, padding: '8px 32px',
              fontSize: 13, fontFamily: 'IBM Plex Sans, sans-serif',
              outline: 'none', appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="Semua GI">Semua GI</option>
            {giOptions.map(gi => (
              <option key={gi.id} value={gi.nama_gi}>{gi.nama_gi}</option>
            ))}
          </select>
        </div>

        {/* Type chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHIPS.map(chip => {
            const active = activeChip === chip;
            const s = chip !== 'Semua' ? TYPE_STYLE[chip] : null;
            return (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                style={{
                  background: active ? (s ? s.bgVar : 'var(--accent-bg)') : 'transparent',
                  color:      active ? (s ? s.colorVar : 'var(--accent)') : 'var(--dim)',
                  border: `1px solid ${active ? (s ? s.colorVar : 'var(--accent)') : 'var(--border)'}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: 12,
                  fontWeight: active ? 700 : 400, cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans, sans-serif', transition: 'all 0.15s',
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dim)', marginBottom: 8, padding: '0 2px' }}>
        <span>
          {loading ? 'Memuat data...' : `${alarms.length} dari ${total} record`}
          {selectedGI !== 'Semua GI' && (
            <span style={{ color: 'var(--accent)', marginLeft: 4 }}>· {selectedGI}</span>
          )}
        </span>
        <span>hal. {page}/{totalPages}</span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--pickup-bg)', border: '1px solid var(--pickup-border)',
          borderRadius: 12, padding: '12px', marginBottom: 10,
          fontSize: 13, color: 'var(--pickup)', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '28px 80px 60px 1fr',
          padding: '8px 12px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
        }}>
          {['#', 'Waktu', 'Jenis', 'GI / Feeder'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 80px 60px 1fr',
              padding: '12px', borderBottom: '1px solid var(--border)', alignItems: 'center',
            }}>
              {[20, 60, 40, 80].map((w, j) => (
                <div key={j} style={{ width: w, height: 9, background: 'var(--surface2)', borderRadius: 4 }} />
              ))}
            </div>
          ))
        ) : alarms.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
            Tidak ada data
          </div>
        ) : alarms.map((alarm, i) => {
          const s = TYPE_STYLE[alarm.jenis] || TYPE_STYLE.OTHER;
          const rowNum = i + 1;
          return (
            <div
              key={alarm.id}
              style={{
                display: 'grid', gridTemplateColumns: '28px 80px 60px 1fr',
                padding: '10px 12px',
                borderBottom: i < alarms.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--dim)' }}>
                {String(rowNum).padStart(3, '0')}
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                {formatDateTime(alarm.timestamp)}
              </span>
              <span style={{
                background: s.bgVar, color: s.colorVar,
                border: `1px solid ${s.colorVar}44`,
                borderRadius: 5, padding: '2px 5px',
                fontSize: 10, fontWeight: 700, width: 'fit-content',
              }}>
                {alarm.jenis}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {alarm.gi_name || alarm.gi_code}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alarm.feeder_name || alarm.feeder_code}
                  </span>
                  {alarm.status === 'ACTIVE'
                    ? <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pickup)', flexShrink: 0 }} />
                    : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 4px' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            background: page === 1 ? 'transparent' : 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px',
            color: page === 1 ? 'var(--border)' : 'var(--text)',
            cursor: page === 1 ? 'default' : 'pointer',
            fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif',
          }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 12, color: 'var(--dim)' }}>Halaman {page} dari {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          style={{
            background: page === totalPages ? 'transparent' : 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px',
            color: page === totalPages ? 'var(--border)' : 'var(--text)',
            cursor: page === totalPages ? 'default' : 'pointer',
            fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
