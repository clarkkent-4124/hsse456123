import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

// ── Badge configs ─────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  berjalan: { label: 'Berjalan', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  selesai:  { label: 'Selesai',  color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
};
const HASIL_CFG = {
  'aman':             { label: 'Aman',             color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
  'tidak aman':       { label: 'Tidak Aman',       color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  'tidak termonitor': { label: 'Tdk Termonitor',   color: '#8899b4', bg: 'rgba(136,153,180,0.15)' },
};

function Badge({ value, cfg }) {
  const c = cfg[value?.toLowerCase?.()] || { label: value || '—', color: 'var(--dim)', bg: 'transparent' };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700,
      color: c.color, background: c.bg,
      border: `1px solid ${c.color}44`,
      borderRadius: 4, padding: '2px 6px',
      whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>
      {c.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(str, n = 55) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── Summary card ──────────────────────────────────────────────────
function SummaryCard({ label, value, color, bg, border, icon, loading }) {
  return (
    <div style={{
      flex: 1, padding: '12px 10px',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 12,
      display: 'flex', flexDirection: 'column', gap: 6,
      position: 'relative', overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* watermark */}
      <div style={{
        position: 'absolute', right: -4, bottom: -6,
        fontSize: 44, fontWeight: 900, color,
        opacity: 0.07, lineHeight: 1, userSelect: 'none',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {label[0]}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.8 }}>{icon}</span>
      </div>
      {loading ? (
        <div className="skeleton" style={{ width: 40, height: 26, borderRadius: 4 }} />
      ) : (
        <div style={{
          fontSize: 28, fontWeight: 700, color,
          fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
        }}>
          {value ?? 0}
        </div>
      )}
    </div>
  );
}

// ── Laporan list item ─────────────────────────────────────────────
function LaporanItem({ row, index }) {
  const isUnsafe = row.hasil_monitoring === 'tidak aman';

  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 6,
      background: isUnsafe ? 'rgba(239,68,68,0.04)' : 'transparent',
    }}>
      {/* Top row: ID + tanggal + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--accent)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          #{index + 1}
        </span>
        <span style={{ fontSize: 10, color: 'var(--dim)', flex: 1 }}>
          {fmtDate(row.tanggal)}
        </span>
        <Badge value={row.status_pekerjaan} cfg={STATUS_CFG} />
        {row.hasil_monitoring && <Badge value={row.hasil_monitoring} cfg={HASIL_CFG} />}
      </div>

      {/* Uraian */}
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
        {truncate(row.uraian_pekerjaan)}
      </div>

      {/* Meta: UP3 · pelaksana */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {row.nama_up3 && (
          <span style={{
            fontSize: 10, color: 'var(--dim)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 4, padding: '1px 6px',
          }}>
            {row.nama_up3}
          </span>
        )}
        {row.nama_ulp && (
          <span style={{
            fontSize: 10, color: 'var(--dim)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 4, padding: '1px 6px',
          }}>
            {row.nama_ulp}
          </span>
        )}
        {row.nama_pelaksana && (
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>
            👤 {row.nama_pelaksana}
          </span>
        )}
      </div>

      {/* Temuan alert */}
      {isUnsafe && row.temuan_k3 && (
        <div style={{
          fontSize: 11, color: '#ef4444',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 6, padding: '6px 10px',
          display: 'flex', gap: 6, alignItems: 'flex-start',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{truncate(row.temuan_k3, 80)}</span>
        </div>
      )}
    </div>
  );
}

function SkeletonItem() {
  return (
    <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 30, height: 10, borderRadius: 3 }} />
        <div className="skeleton" style={{ width: 70, height: 10, borderRadius: 3 }} />
        <div className="skeleton" style={{ marginLeft: 'auto', width: 50, height: 14, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: '85%', height: 13, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '55%', height: 13, borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton" style={{ width: 80, height: 18, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function ViewerDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [summary,       setSummary]       = useState(null);
  const [rows,          setRows]          = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList,   setLoadingList]   = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filterDate,    setFilterDate]    = useState(today);
  const [totalCount,    setTotalCount]    = useState(0);
  const [page,          setPage]          = useState(1);
  const LIMIT = 15;

  const fetchData = useCallback(async (date, pg, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoadingSummary(true); setLoadingList(true); }

    const params = { limit: LIMIT, page: pg };
    if (date) { params.tanggal_dari = date; params.tanggal_sampai = date; }

    const [sumRes, listRes] = await Promise.allSettled([
      api.getDashboardSummary(),
      api.getLaporan(params),
    ]);

    if (sumRes.status === 'fulfilled')  setSummary(sumRes.value.data);
    if (listRes.status === 'fulfilled') {
      const d = listRes.value;
      setRows(d.data || []);
      setTotalCount(d.pagination?.total || 0);
    }

    setLoadingSummary(false);
    setLoadingList(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(filterDate, page); }, [fetchData, filterDate, page]);

  function handleDateChange(v) {
    setFilterDate(v);
    setPage(1);
  }

  function handleRefresh() {
    fetchData(filterDate, page, true);
  }

  const hasMore  = page * LIMIT < totalCount;
  const isFiltered = filterDate !== '';

  const CARDS = [
    {
      label: 'Hari Ini', value: summary?.total_hari_ini,
      color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--accent-border)',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
    },
    {
      label: 'Tdk Aman', value: summary?.tidak_aman,
      color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      label: 'SWA', value: summary?.swa_aktif,
      color: 'var(--swa)', bg: 'var(--swa-bg)', border: 'var(--swa-border)',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Date filter + refresh ─────────────────────────── */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Tanggal
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={e => handleDateChange(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              color: 'var(--text)',
              fontSize: 12,
              fontFamily: "'IBM Plex Sans', sans-serif",
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', paddingBottom: 1 }}>
          {isFiltered && (
            <button
              onClick={() => handleDateChange('')}
              style={{
                padding: '7px 10px', borderRadius: 7,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Semua
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '7px 12px', borderRadius: 7,
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', fontSize: 11, fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────── */}
      <div style={{ padding: '12px 14px 0', display: 'flex', gap: 8 }}>
        {CARDS.map(c => (
          <SummaryCard key={c.label} {...c} loading={loadingSummary} />
        ))}
      </div>

      {/* ── Laporan list ──────────────────────────────────── */}
      <div style={{ marginTop: 14 }}>
        {/* List header */}
        <div style={{
          padding: '10px 16px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              Laporan Pengawasan
            </span>
            {!loadingList && (
              <span style={{ fontSize: 10, color: 'var(--dim)', marginLeft: 6 }}>
                ({totalCount} total)
              </span>
            )}
          </div>
          {isFiltered && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--accent)',
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase',
            }}>
              Filter aktif
            </span>
          )}
        </div>

        {/* List body */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none' }}>
          {loadingList ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
          ) : rows.length === 0 ? (
            <div style={{
              padding: '48px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              <span style={{ fontSize: 13, color: 'var(--dim)', textAlign: 'center' }}>
                {isFiltered ? 'Tidak ada laporan pada tanggal ini.' : 'Belum ada laporan.'}
              </span>
            </div>
          ) : (
            <>
              {rows.map((row, idx) => <LaporanItem key={row.id} row={row} index={idx} />)}

              {/* Load more */}
              {hasMore && (
                <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={loadingList}
                    style={{
                      padding: '8px 24px', borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--muted)', fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                  >
                    Muat lebih banyak
                  </button>
                </div>
              )}

              {/* Pagination info */}
              {!hasMore && rows.length > 0 && (
                <div style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)' }}>
                    Menampilkan {rows.length} dari {totalCount} laporan
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
