import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import { exportToExcel } from '../../utils/excelExport';

// ── Constants ─────────────────────────────────────────────────────
const STATUS_SWA_CFG = {
  'diberhentikan':                 { label: 'Diberhentikan', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  'berjalan setelah perbaikan':    { label: 'Berjalan Setelah Perbaikan', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
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
        fontFamily: 'inherit',
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
            flex: 1,
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
            <div style={grid2}>
              <Row label="Tim" value={swa.regu || swa.nama_regu} />
              <Row label="Vendor" value={swa.nama_vendor} />
            </div>
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
function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalEditSWA({ open, onClose, swa, onSuccess }) {
  const [form, setForm] = useState({ catatan: '', tindakan: '', status_swa: '', keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !swa) return;
    setForm({
      catatan: swa.catatan || '',
      tindakan: swa.tindakan || '',
      status_swa: swa.status_swa || '',
      keterangan: swa.keterangan || '',
    });
    setError('');
  }, [open, swa]);

  if (!swa) return null;

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.updateSWA(swa.id, {
        catatan: form.catatan,
        tindakan: form.tindakan,
        status_swa: form.status_swa,
        keterangan: form.keterangan || null,
      });
      onSuccess(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui SWA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit SWA · ${swa.id}`} width={560}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            fontSize: 12,
          }}>
            {error}
          </div>
        )}
        <Field label="Catatan / Temuan" required>
          <textarea value={form.catatan} onChange={e => set('catatan', e.target.value)} required rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <Field label="Tindakan yang Diambil" required>
          <textarea value={form.tindakan} onChange={e => set('tindakan', e.target.value)} required rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <Field label="Status SWA" required>
          <select value={form.status_swa} onChange={e => set('status_swa', e.target.value)} required style={inputStyle}>
            <option value="">-- Pilih --</option>
            <option value="berjalan setelah perbaikan">Berjalan Setelah Perbaikan</option>
            <option value="diberhentikan">Diberhentikan</option>
          </select>
        </Field>
        <Field label="Keterangan Tambahan">
          <textarea value={form.keterangan} onChange={e => set('keterangan', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '9px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Batal
          </button>
          <button type="submit" disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: loading ? 'var(--dim)' : '#ef4444',
            border: 'none', color: '#fff', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalDeleteSWA({ open, onClose, swa, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  if (!swa) return null;

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      const res = await api.deleteSWA(swa.id);
      onSuccess(swa.id, res.message);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal menghapus SWA.');
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Hapus SWA" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Hapus data SWA <strong style={{ color: 'var(--text)' }}>{swa.id}</strong>? Tindakan ini tidak dapat dibatalkan.
        </div>
        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', fontSize: 12,
          }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '9px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Batal
          </button>
          <button type="button" onClick={handleDelete} disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: loading ? 'var(--dim)' : '#ef4444',
            border: 'none', color: '#fff', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const FILTER_BLANK = { tanggal_dari: '', tanggal_sampai: '', id_laporan: '', lokasi: '', id_up3: '', id_ulp: '' };
const PAGE_LIMIT = 15;
const EXPORT_LIMIT = 500;
const sameId = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

const SWA_EXPORT_COLUMNS = [
  { header: 'No', value: (_, index) => index + 1 },
  { header: 'ID SWA', key: 'id' },
  { header: 'No Urut SWA', key: 'no_urut' },
  { header: 'Tanggal SWA', key: 'tanggal' },
  { header: 'ID Laporan Pengawasan', key: 'id_laporan_pengawasan' },
  { header: 'Tanggal Laporan', key: 'tanggal_laporan' },
  { header: 'Uraian Pekerjaan', key: 'uraian_pekerjaan' },
  { header: 'Lokasi', key: 'lokasi' },
  { header: 'UP3', key: 'nama_up3' },
  { header: 'ULP', key: 'nama_ulp' },
  { header: 'Regu', value: row => row.regu || row.nama_regu },
  { header: 'Vendor', key: 'nama_vendor' },
  { header: 'Status Pekerjaan', key: 'status_pekerjaan' },
  { header: 'Hasil Monitoring', key: 'hasil_monitoring' },
  { header: 'Catatan SWA', key: 'catatan' },
  { header: 'Tindakan SWA', key: 'tindakan' },
  { header: 'Status SWA', key: 'status_swa' },
  { header: 'Keterangan SWA', key: 'keterangan' },
  { header: 'Created By', key: 'created_by' },
  { header: 'Created At', key: 'created_at' },
  { header: 'Updated At', key: 'updated_at' },
];

export default function SWAPage() {
  const [master, setMaster] = useState({ up3: [], ulp: [] });
  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);

  const [draftFilter,   setDraftFilter]   = useState(FILTER_BLANK);
  const [appliedFilter, setAppliedFilter] = useState(FILTER_BLANK);
  const [currentPage,   setCurrentPage]   = useState(1);

  const [detailSWA, setDetailSWA] = useState(null);
  const [editSWA, setEditSWA] = useState(null);
  const [deleteSWA, setDeleteSWA] = useState(null);

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
      const params = buildSWAParams(filter, page, PAGE_LIMIT);
      const res = await api.getSWA(params);
      setRows(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
    } catch (err) {
      setRows([]);
      setPagination({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
      showToast(err?.message || 'Gagal memuat data SWA.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSWA(appliedFilter, currentPage);
  }, [appliedFilter, currentPage, fetchSWA]);

  useEffect(() => {
    Promise.allSettled([api.getUP3(), api.getULP()]).then(([up3Res, ulpRes]) => {
      setMaster({
        up3: up3Res.status === 'fulfilled' ? (up3Res.value.data || []) : [],
        ulp: ulpRes.status === 'fulfilled' ? (ulpRes.value.data || []) : [],
      });
    });
  }, []);

  const setDraft = (k, v) => setDraftFilter(f => ({ ...f, [k]: v }));

  function applyFilter() { setCurrentPage(1); setAppliedFilter({ ...draftFilter }); }
  function resetFilter()  {
    setDraftFilter(FILTER_BLANK);
    setCurrentPage(1);
    setAppliedFilter(FILTER_BLANK);
  }

  function buildSWAParams(filter, page, limit) {
    const params = { page, limit };
    if (filter.tanggal_dari)   params.tanggal_dari  = filter.tanggal_dari;
    if (filter.tanggal_sampai) params.tanggal_sampai= filter.tanggal_sampai;
    if (filter.id_laporan)     params.id_laporan    = filter.id_laporan.trim();
    if (filter.lokasi)         params.lokasi        = filter.lokasi.trim();
    if (filter.id_up3)         params.id_up3        = filter.id_up3;
    if (filter.id_ulp)         params.id_ulp        = filter.id_ulp;
    return params;
  }

  async function fetchAllSWAForExport() {
    const first = await api.getSWA(buildSWAParams(appliedFilter, 1, EXPORT_LIMIT));
    const rowsFirst = first.data || [];
    const totalPages = first.pagination?.totalPages || 1;
    if (totalPages <= 1) return rowsFirst;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, idx) =>
        api.getSWA(buildSWAParams(appliedFilter, idx + 2, EXPORT_LIMIT))
      )
    );
    return rowsFirst.concat(...rest.map(res => res.data || []));
  }

  async function handleDownloadExcel() {
    setExporting(true);
    try {
      const data = await fetchAllSWAForExport();
      exportToExcel({
        filename: `swa-${new Date().toISOString().slice(0, 10)}.xls`,
        sheetName: 'SWA',
        columns: SWA_EXPORT_COLUMNS,
        rows: data,
      });
      showToast(`${data.length} data SWA berhasil diunduh.`);
    } catch {
      showToast('Gagal download Excel SWA.', 'error');
    } finally {
      setExporting(false);
    }
  }

  function handleEditSuccess(updatedRow, message) {
    showToast(message || 'SWA berhasil diperbarui.');
    setRows(prev => prev.map(row => row.id === updatedRow.id ? { ...row, ...updatedRow } : row));
    fetchSWA(appliedFilter, currentPage);
  }

  function handleDeleteSuccess(id, message) {
    showToast(message || 'SWA berhasil dihapus.');
    setRows(prev => prev.filter(row => row.id !== id));
    fetchSWA(appliedFilter, currentPage);
  }

  const hasFilter = Object.values(appliedFilter).some(v => v !== '');
  const filteredFilterUlp = master.ulp.filter(r => draftFilter.id_up3 && sameId(r.id_up3, draftFilter.id_up3));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? '#10b981' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? '#059669' : '#ef4444'}`,
          color: toast.type === 'success' ? '#fff' : '#ef4444',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(239,68,68,0.07), transparent 52%, rgba(168,85,247,0.06))',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                Stop Work Authority
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '5px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              Pantau tindakan penghentian pekerjaan dan tindak lanjut dari laporan pengawasan tidak aman.
            </p>
          </div>

        </div>
      </section>

      {/* ── Filter bar ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '17px 20px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      }}>
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

          <div style={{ minWidth: 180 }}>
            <label style={labelStyle}>Lokasi</label>
            <input type="text" value={draftFilter.lokasi}
              onChange={e => setDraft('lokasi', e.target.value)}
              placeholder="Filter lokasi"
              style={{ ...inputStyle, width: 180 }} />
          </div>

          <div style={{ minWidth: 170 }}>
            <label style={labelStyle}>UP3</label>
            <select
              value={draftFilter.id_up3}
              onChange={e => setDraftFilter(f => ({ ...f, id_up3: e.target.value, id_ulp: '' }))}
              style={{ ...inputStyle, width: 170 }}
            >
              <option value="">Semua UP3</option>
              {master.up3.map(r => <option key={r.id} value={r.id}>{r.nama_up3}</option>)}
            </select>
          </div>

          <div style={{ minWidth: 170 }}>
            <label style={labelStyle}>ULP</label>
            <select
              value={draftFilter.id_ulp}
              onChange={e => setDraft('id_ulp', e.target.value)}
              disabled={!draftFilter.id_up3}
              style={{ ...inputStyle, width: 170, opacity: draftFilter.id_up3 ? 1 : 0.65 }}
            >
              <option value="">{draftFilter.id_up3 ? 'Semua ULP' : 'Pilih UP3 dulu'}</option>
              {filteredFilterUlp.map(r => <option key={r.id} value={r.id}>{r.nama_ulp}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginLeft: 'auto' }}>
            <button onClick={handleDownloadExcel} disabled={exporting} style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#10b981', fontSize: 12, fontWeight: 700,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.65 : 1,
              fontFamily: "'IBM Plex Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? 'Menyiapkan...' : 'Excel'}
            </button>
            {hasFilter && (
              <button onClick={resetFilter} style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M3 12a9 9 0 1 0 3-6.7"/>
                  <polyline points="3 3 3 9 9 9"/>
                </svg>
                Reset
              </button>
            )}
            <button onClick={applyFilter} style={{
              padding: '10px 22px', borderRadius: 9,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* ── Data table ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#263244' }}>
                {['No', 'ID SWA / Tanggal', 'Laporan Pengawasan', 'Lokasi', 'Catatan', 'Tindakan', 'Status SWA', 'Aksi'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px',
                    fontSize: 10, fontWeight: 700,
                    color: '#a8b7d0', textAlign: 'center',
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
                    {[40, 130, 160, 140, 180, 160, 90, 70].map((w, j) => (
                      <td key={j} style={{ padding: '15px 16px' }}>
                        <div className="skeleton" style={{ width: w, height: 12, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '52px 14px', textAlign: 'center' }}>
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
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* No */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* ID / Tanggal */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                      {row.id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                      {fmtDate(row.tanggal)}
                    </div>
                  </td>

                  {/* Laporan */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
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
                  <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>
                      {truncate(row.lokasi, 42)}
                    </span>
                  </td>

                  {/* Catatan */}
                  <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>
                      {truncate(row.catatan, 50)}
                    </span>
                  </td>

                  {/* Tindakan */}
                  <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {truncate(row.tindakan, 50)}
                    </span>
                  </td>

                  {/* Status SWA */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <Badge value={row.status_swa} cfg={STATUS_SWA_CFG} />
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => setDetailSWA(row)}
                        title="Detail SWA"
                        style={{
                          width: 32, height: 32, padding: 0, borderRadius: 8,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditSWA(row)}
                        title="Edit SWA"
                        style={{
                          width: 32, height: 32, padding: 0, borderRadius: 8,
                          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                          color: '#f59e0b', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteSWA(row)}
                        title="Hapus SWA"
                        style={{
                          width: 32, height: 32, padding: 0, borderRadius: 8,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
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
        {!loading && (
          <div style={{
            padding: pagination.totalPages > 1 ? '0 16px 12px' : '10px 16px 12px',
            borderTop: pagination.totalPages > 1 ? 'none' : '1px solid var(--border)',
            textAlign: 'right',
            fontSize: 10,
            color: 'var(--dim)',
            fontWeight: 600,
          }}>
            {pagination.total} {hasFilter ? 'hasil filter' : 'total SWA'}
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalDetailSWA
        open={!!detailSWA}
        onClose={() => setDetailSWA(null)}
        swa={detailSWA}
      />
      <ModalEditSWA
        open={!!editSWA}
        onClose={() => setEditSWA(null)}
        swa={editSWA}
        onSuccess={handleEditSuccess}
      />
      <ModalDeleteSWA
        open={!!deleteSWA}
        onClose={() => setDeleteSWA(null)}
        swa={deleteSWA}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
