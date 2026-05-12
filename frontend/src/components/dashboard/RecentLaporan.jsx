import { useMemo, useState } from 'react';

const STATUS_PEKERJAAN = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  berjalan: { label: 'Berjalan', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  selesai: { label: 'Selesai', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const KETERANGAN_CCTV = {
  aktif: { label: 'Aktif', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'tidak aktif': { label: 'Tidak Aktif', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'tidak muncul di ezviz': { label: 'Tidak Terpantau Ezviz', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const STATUS_APD = {
  lengkap: { label: 'Lengkap', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'tidak lengkap': { label: 'Tidak Lengkap', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4', bg: 'rgba(136,153,180,0.12)' },
};

const FILTER_BLANK = {
  no: '',
  up3: '',
  regu: '',
  ulp: '',
  uraian: '',
  status_pekerjaan: '',
  swa: '',
  keterangan_cctv: '',
  status_apd: '',
};
const PAGE_SIZE = 15;

const inputStyle = {
  width: '100%',
  minWidth: 120,
  padding: '7px 9px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  color: 'var(--text)',
  fontSize: 12,
  fontFamily: "'IBM Plex Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

function StatusBadge({ value, map }) {
  const cfg = map[value?.toLowerCase?.()] || { label: value || '-', color: 'var(--dim)', bg: 'transparent' };
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
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

function truncate(str, n = 52) {
  if (!str) return '-';
  return str.length > n ? `${str.slice(0, n)}...` : str;
}

function includes(value, query) {
  return String(value || '').toLowerCase().includes(String(query || '').trim().toLowerCase());
}

function getRegu(row) {
  return row?.regu || row?.nama_regu || '';
}

function SkeletonRow() {
  return (
    <tr>
      {[36, 120, 120, 120, 220, 100, 130, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ width: w, height: 12, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function RecentLaporan({ data, loading }) {
  const [filters, setFilters] = useState(FILTER_BLANK);
  const [currentPage, setCurrentPage] = useState(1);
  const rows = useMemo(() => data || [], [data]);

  const setFilter = (key, value) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const hasFilter = Object.values(filters).some(Boolean);

  const filteredRows = useMemo(() => {
    return rows.filter((row, idx) => {
      const no = idx + 1;
      return (
        includes(no, filters.no) &&
        includes(row.nama_up3, filters.up3) &&
        includes(getRegu(row), filters.regu) &&
        includes(row.nama_ulp, filters.ulp) &&
        includes(row.uraian_pekerjaan, filters.uraian) &&
        (!filters.status_pekerjaan || row.status_pekerjaan === filters.status_pekerjaan) &&
        (!filters.swa || (filters.swa === 'ada' ? Number(row.has_swa) === 1 : Number(row.has_swa) !== 1)) &&
        (!filters.keterangan_cctv || row.keterangan_cctv === filters.keterangan_cctv) &&
        (!filters.status_apd || row.status_apd === filters.status_apd)
      );
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="dashboard-report-table" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div className="dashboard-report-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '17px 20px 15px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(34,211,238,0.06), transparent)',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Semua Laporan</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Filter cepat berdasarkan kolom data laporan
          </div>
        </div>
        {hasFilter && (
          <button
            onClick={() => {
              setCurrentPage(1);
              setFilters(FILTER_BLANK);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <polyline points="3 3 3 9 9 9" />
            </svg>
            Reset
          </button>
        )}
      </div>

      <div className="dashboard-report-filters" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
        gap: 10,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        <input style={inputStyle} value={filters.no} onChange={e => setFilter('no', e.target.value)} placeholder="Filter No" />
        <input style={inputStyle} value={filters.up3} onChange={e => setFilter('up3', e.target.value)} placeholder="Filter UP3" />
        <input style={inputStyle} value={filters.regu} onChange={e => setFilter('regu', e.target.value)} placeholder="Filter Regu" />
        <input style={inputStyle} value={filters.ulp} onChange={e => setFilter('ulp', e.target.value)} placeholder="Filter ULP" />
        <input style={inputStyle} value={filters.uraian} onChange={e => setFilter('uraian', e.target.value)} placeholder="Filter Uraian" />
        <select style={inputStyle} value={filters.status_pekerjaan} onChange={e => setFilter('status_pekerjaan', e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="berjalan">Berjalan</option>
          <option value="selesai">Selesai</option>
        </select>
        <select style={inputStyle} value={filters.swa} onChange={e => setFilter('swa', e.target.value)}>
          <option value="">Semua SWA</option>
          <option value="ada">Ada SWA</option>
          <option value="tidak ada">Tidak Ada SWA</option>
        </select>
        <select style={inputStyle} value={filters.keterangan_cctv} onChange={e => setFilter('keterangan_cctv', e.target.value)}>
          <option value="">Semua CCTV</option>
          <option value="aktif">Aktif</option>
          <option value="tidak aktif">Tidak Aktif</option>
          <option value="tidak muncul di Ezviz">Tidak Terpantau Ezviz</option>
        </select>
        <select style={inputStyle} value={filters.status_apd} onChange={e => setFilter('status_apd', e.target.value)}>
          <option value="">Semua APD</option>
          <option value="lengkap">Lengkap</option>
          <option value="tidak lengkap">Tidak Lengkap</option>
          <option value="tidak termonitor">Tidak Termonitor</option>
        </select>
      </div>

      <div className="dashboard-report-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#263244' }}>
              {['No', 'UP3', 'Regu', 'ULP', 'Uraian Pekerjaan', 'Status Pekerjaan', 'Keterangan CCTV', 'Kelengkapan APD'].map(header => (
                <th key={header} style={{
                  padding: '11px 16px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#a8b7d0',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--dim)' }}>
                    {hasFilter ? 'Tidak ada laporan yang cocok dengan filter.' : 'Belum ada laporan.'}
                  </span>
                </td>
              </tr>
            ) : pagedRows.map((row, idx) => {
              const rowNumber = idx + 1;
              return (
              <tr
                key={row.id}
                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 700 }}>{rowNumber}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.nama_up3 || '-'}</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' }}>{getRegu(row) || '-'}</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.nama_ulp || '-'}</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text)', minWidth: 220 }}>
                  {truncate(row.uraian_pekerjaan, 58)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <StatusBadge value={row.status_pekerjaan} map={STATUS_PEKERJAAN} />
                    {Number(row.has_swa) === 1 && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: 5,
                        padding: '2px 7px',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                      }}>
                        SWA
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <StatusBadge value={row.keterangan_cctv} map={KETERANGAN_CCTV} />
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <StatusBadge value={row.status_apd} map={STATUS_APD} />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="dashboard-report-pagination" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 600 }}>
            Halaman {page} dari {totalPages} · {filteredRows.length} dari {rows.length} laporan
          </span>
          <div className="dashboard-report-page-actions" style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: page <= 1 ? 'var(--dim)' : 'var(--muted)',
                fontSize: 12,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: page >= totalPages ? 'var(--dim)' : 'var(--muted)',
                fontSize: 12,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
