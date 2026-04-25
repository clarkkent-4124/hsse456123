/**
 * Tabel 5 laporan terbaru untuk Admin Dashboard.
 * Data dari GET /api/laporan?limit=5&page=1
 */

const STATUS_PEKERJAAN = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  berjalan: { label: 'Berjalan', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  selesai:  { label: 'Selesai',  color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const HASIL_MONITORING = {
  'aman':             { label: 'Aman',             color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  'tidak aman':       { label: 'Tidak Aman',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4', bg: 'rgba(136,153,180,0.12)' },
};

function StatusBadge({ value, map }) {
  const cfg = map[value?.toLowerCase?.()] || { label: value || '—', color: 'var(--dim)', bg: 'transparent' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 5,
      padding: '2px 7px',
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function truncate(str, n = 40) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 80, 140, 80, 80].map((w, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div className="skeleton" style={{ width: w, height: 12, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function RecentLaporan({ data, loading }) {
  const rows = data || [];

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 14px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            Laporan Terbaru
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            5 laporan pengawasan terakhir
          </div>
        </div>
        <a
          href="/admin/laporan_pengawasan"
          style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--accent)',
            textDecoration: 'none',
            padding: '4px 10px',
            border: '1px solid var(--accent-border)',
            borderRadius: 6,
            background: 'var(--accent-bg)',
          }}
        >
          Lihat Semua →
        </a>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['No', 'Tanggal', 'Pekerjaan', 'Status', 'Hasil Monitoring'].map(h => (
                <th key={h} style={{
                  padding: '8px 14px',
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--dim)',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px 14px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--dim)' }}>Belum ada laporan</span>
                  </div>
                </td>
              </tr>
            ) : rows.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* No */}
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--dim)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    #{row.no_urut || '—'}
                  </span>
                </td>

                {/* Tanggal */}
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(row.tanggal)}
                  </span>
                </td>

                {/* Pekerjaan */}
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {truncate(row.uraian_pekerjaan, 42)}
                  </div>
                  {row.nama_up3 && (
                    <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                      {row.nama_up3}
                      {row.nama_ulp ? ` · ${row.nama_ulp}` : ''}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <StatusBadge value={row.status_pekerjaan} map={STATUS_PEKERJAAN} />
                </td>

                {/* Hasil monitoring */}
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  {row.hasil_monitoring
                    ? <StatusBadge value={row.hasil_monitoring} map={HASIL_MONITORING} />
                    : <span style={{ fontSize: 11, color: 'var(--dim)' }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
