import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';

// ── Constants ─────────────────────────────────────────────────────
const STATUS_SWA_CFG = {
  'diberhentikan': { label: 'Diberhentikan', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  'dilanjutkan':   { label: 'Dilanjutkan',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'diselesaikan':  { label: 'Diselesaikan',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const STATUS_PEKERJAAN_CFG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  berjalan: { label: 'Berjalan', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  selesai:  { label: 'Selesai',  color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

// ── Style helpers ─────────────────────────────────────────────────
const labelStyle = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 5,
  display: 'block',
};

const sectionHeadStyle = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid var(--border)',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: "'IBM Plex Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

// ── Mini helpers ──────────────────────────────────────────────────
function Badge({ value, cfg }) {
  const c = cfg[value?.toLowerCase?.()] || { label: value || '—', color: 'var(--dim)', bg: 'transparent' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: c.color, background: c.bg,
      border: `1px solid ${c.color}33`,
      borderRadius: 5, padding: '2px 7px',
      whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>
      {c.label}
    </span>
  );
}

function truncate(str, n = 55) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// ── ModalDetailSWA ────────────────────────────────────────────────
function ModalDetailSWA({ open, onClose, swa }) {
  if (!swa) return null;

  const Row = ({ label, value, mono, accent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={labelStyle}>{label}</span>
      <span style={{
        fontSize: 13,
        color: accent ? 'var(--accent)' : value ? 'var(--text)' : 'var(--dim)',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        lineHeight: 1.5,
      }}>
        {value || '—'}
      </span>
    </div>
  );

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  return (
    <Modal open={open} onClose={onClose} title={`Detail SWA · ${swa.id}`} width={660}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header strip */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#ef4444',
            fontFamily: 'JetBrains Mono, monospace', flex: 1,
          }}>
            {swa.id}
          </span>
          <Badge value={swa.status_swa} cfg={STATUS_SWA_CFG} />
        </div>

        {/* SWA Info */}
        <div>
          <div style={sectionHeadStyle}>Informasi SWA</div>
          <div style={grid2}>
            <Row label="Tanggal SWA"  value={fmtDateTime(swa.tanggal)} />
            <Row label="No Urut"      value={swa.no_urut ? `#${swa.no_urut}` : '—'} mono />
          </div>
        </div>

        {/* Laporan terkait */}
        <div>
          <div style={sectionHeadStyle}>Laporan Pengawasan Terkait</div>
          <div style={{
            padding: '12px 14px', borderRadius: 9,
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={grid2}>
              <Row label="ID Laporan"   value={swa.id_laporan_pengawasan} mono accent />
              <Row label="Tanggal Laporan" value={fmtDate(swa.tanggal_laporan)} />
            </div>
            <Row label="Uraian Pekerjaan" value={swa.uraian_pekerjaan} />
            <div style={grid2}>
              <div>
                <span style={labelStyle}>Status Pekerjaan</span>
                <div style={{ marginTop: 4 }}>
                  {swa.status_pekerjaan
                    ? <Badge value={swa.status_pekerjaan} cfg={STATUS_PEKERJAAN_CFG} />
                    : <span style={{ fontSize: 13, color: 'var(--dim)' }}>—</span>}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Hasil Monitoring</span>
                <div style={{ marginTop: 6, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                  {swa.hasil_monitoring || '—'}
                </div>
              </div>
            </div>
            {swa.nama_up3 && (
              <Row label="UP3" value={swa.nama_up3} />
            )}
          </div>
        </div>

        {/* Catatan & Tindakan */}
        <div>
          <div style={sectionHeadStyle}>Catatan & Tindakan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label="Catatan / Temuan" value={swa.catatan} />
            <Row label="Tindakan yang Diambil" value={swa.tindakan} />
            {swa.keterangan && <Row label="Keterangan" value={swa.keterangan} />}
          </div>
        </div>

        {/* Audit */}
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label="Dibuat"    value={fmtDateTime(swa.created_at)} />
            {swa.updated_at && <Row label="Diperbarui" value={fmtDateTime(swa.updated_at)} />}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
const FILTER_BLANK = { tanggal_dari: '', tanggal_sampai: '', id_laporan: '' };

export default function SWAPage() {
  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);

  const [draftFilter,   setDraftFilter]   = useState(FILTER_BLANK);
  const [appliedFilter, setAppliedFilter] = useState(FILTER_BLANK);
  const [currentPage,   setCurrentPage]   = useState(1);

  const [detailSWA, setDetailSWA] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  const fetchSWA = useCallback(async (filter, page) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.tanggal_dari)  params.tanggal_dari  = filter.tanggal_dari;
      if (filter.tanggal_sampai)params.tanggal_sampai= filter.tanggal_sampai;
      if (filter.id_laporan)    params.id_laporan    = filter.id_laporan.trim();

      const res = await api.getSWA(params);
      setRows(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSWA(appliedFilter, currentPage);
  }, [appliedFilter, currentPage, fetchSWA]);

  const setDraft = (k, v) => setDraftFilter(f => ({ ...f, [k]: v }));

  function applyFilter() { setCurrentPage(1); setAppliedFilter({ ...draftFilter }); }
  function resetFilter()  {
    setDraftFilter(FILTER_BLANK);
    setCurrentPage(1);
    setAppliedFilter(FILTER_BLANK);
  }

  const hasFilter = Object.values(appliedFilter).some(v => v !== '');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: toast.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Stop Work Authority
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {hasFilter
              ? `${pagination.total} SWA ditemukan (filter aktif)`
              : `Total ${pagination.total} SWA`}
          </p>
        </div>

        {/* Info chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 9,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
            SWA dibuat dari halaman Laporan
          </span>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 18px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14,
        }}>
          Filter
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>Tanggal Dari</label>
            <input type="date" value={draftFilter.tanggal_dari}
              onChange={e => setDraft('tanggal_dari', e.target.value)}
              style={{ ...inputStyle, width: 140 }} />
          </div>

          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>Tanggal Sampai</label>
            <input type="date" value={draftFilter.tanggal_sampai}
              onChange={e => setDraft('tanggal_sampai', e.target.value)}
              style={{ ...inputStyle, width: 140 }} />
          </div>

          <div style={{ minWidth: 200 }}>
            <label style={labelStyle}>ID Laporan</label>
            <input type="text" value={draftFilter.id_laporan}
              onChange={e => setDraft('id_laporan', e.target.value)}
              placeholder="Contoh: LP-20260415-00001"
              style={{ ...inputStyle, width: 200 }} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginLeft: 'auto' }}>
            {hasFilter && (
              <button onClick={resetFilter} style={{
                padding: '8px 14px', borderRadius: 7,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
                Reset
              </button>
            )}
            <button onClick={applyFilter} style={{
              padding: '8px 16px', borderRadius: 7,
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* ── Data table ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['No', 'ID SWA / Tanggal', 'Laporan Pengawasan', 'Catatan', 'Tindakan', 'Status SWA', 'Aksi'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    fontSize: 10, fontWeight: 700,
                    color: 'var(--dim)', textAlign: 'left',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    {[40, 130, 160, 180, 160, 90, 70].map((w, j) => (
                      <td key={j} style={{ padding: '14px' }}>
                        <div className="skeleton" style={{ width: w, height: 12, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '52px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span style={{ fontSize: 13, color: 'var(--dim)' }}>
                        {hasFilter ? 'Tidak ada SWA yang cocok dengan filter.' : 'Belum ada data SWA.'}
                      </span>
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
                    <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                      #{row.no_urut || '—'}
                    </span>
                  </td>

                  {/* ID / Tanggal */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                      {row.id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                      {fmtDate(row.tanggal)}
                    </div>
                  </td>

                  {/* Laporan */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {row.id_laporan_pengawasan}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                      {row.nama_up3 || '—'}
                    </div>
                    {row.tanggal_laporan && (
                      <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 1 }}>
                        {fmtDate(row.tanggal_laporan)}
                      </div>
                    )}
                  </td>

                  {/* Catatan */}
                  <td style={{ padding: '12px 14px', maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>
                      {truncate(row.catatan, 50)}
                    </span>
                  </td>

                  {/* Tindakan */}
                  <td style={{ padding: '12px 14px', maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {truncate(row.tindakan, 50)}
                    </span>
                  </td>

                  {/* Status SWA */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <Badge value={row.status_swa} cfg={STATUS_SWA_CFG} />
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setDetailSWA(row)}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              Halaman {pagination.page} dari {pagination.totalPages} · {pagination.total} total
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: pagination.page <= 1 ? 'var(--dim)' : 'var(--muted)',
                  fontSize: 12, cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: pagination.page >= pagination.totalPages ? 'var(--dim)' : 'var(--muted)',
                  fontSize: 12,
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalDetailSWA
        open={!!detailSWA}
        onClose={() => setDetailSWA(null)}
        swa={detailSWA}
      />
    </div>
  );
}
