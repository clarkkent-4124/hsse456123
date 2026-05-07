import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';

// ── Constants ────────────────────────────────────────────────────
const STATUS_PEKERJAAN_OPTIONS = [
  { value: 'pending',  label: 'Pending'  },
  { value: 'berjalan', label: 'Berjalan' },
  { value: 'selesai',  label: 'Selesai'  },
];

const HASIL_OPTIONS = [
  { value: 'aman',             label: 'Aman'             },
  { value: 'tidak aman',       label: 'Tidak Aman'       },
  { value: 'tidak termonitor', label: 'Tidak Termonitor' },
];

const STATUS_PEKERJAAN_CFG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  berjalan: { label: 'Berjalan', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  selesai:  { label: 'Selesai',  color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const HASIL_CFG = {
  'aman':             { label: 'Aman',             color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  'tidak aman':       { label: 'Tidak Aman',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4', bg: 'rgba(136,153,180,0.12)' },
};

// ── Style helpers ────────────────────────────────────────────────
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

// ── Mini components ──────────────────────────────────────────────
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

function truncate(str, n = 45) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const sameId = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  );
}

// ── ModalAddLaporan ──────────────────────────────────────────────
function ModalAddLaporan({ open, onClose, master, onSuccess, laporan }) {
  const BLANK = {
    tanggal: new Date().toISOString().slice(0, 10),
    id_up3: '', id_ulp: '', id_regu: '', lokasi: '', id_vendor: '',
    uraian_pekerjaan: '', nama_pelaksana: '', jumlah_pekerjaan: 1,
    status_cctv: '', keterangan_cctv: '', status_apd: '', hasil_monitoring: '',
    temuan_status: '', temuan_k3: '', tindak_lanjut: '', keterangan: '',
  };
  const [form, setForm]     = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const isEdit = !!laporan;
  const lockHasilMonitoring = isEdit && Number(laporan?.has_swa) === 1;
  const filteredUlp = (master.ulp || []).filter(r => form.id_up3 && sameId(r.id_up3, form.id_up3));

  useEffect(() => {
    if (!open) return;

    if (laporan) {
      const temuanTidakAda = laporan.temuan_k3 === 'NULL' && laporan.tindak_lanjut === 'NULL';
      setForm({
        tanggal: laporan.tanggal ? String(laporan.tanggal).slice(0, 10) : new Date().toISOString().slice(0, 10),
        id_up3: laporan.id_up3 || '',
        id_ulp: laporan.id_ulp || '',
        id_regu: laporan.id_regu || '',
        lokasi: laporan.lokasi || laporan.nama_lokasi || '',
        id_vendor: laporan.id_vendor || '',
        uraian_pekerjaan: laporan.uraian_pekerjaan || '',
        nama_pelaksana: laporan.nama_pelaksana || '',
        jumlah_pekerjaan: laporan.jumlah_pekerjaan || 1,
        status_cctv: laporan.status_cctv || '',
        keterangan_cctv: laporan.keterangan_cctv || '',
        status_apd: laporan.status_apd || '',
        hasil_monitoring: laporan.hasil_monitoring || '',
        temuan_status: temuanTidakAda ? 'tidak ada' : (laporan.temuan_k3 || laporan.tindak_lanjut ? 'ada' : ''),
        temuan_k3: temuanTidakAda ? '' : (laporan.temuan_k3 || ''),
        tindak_lanjut: temuanTidakAda ? '' : (laporan.tindak_lanjut || ''),
        keterangan: laporan.keterangan || '',
      });
    } else {
      setForm(BLANK);
    }
    setError('');
  }, [open, laporan]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form };
      if (body.temuan_status === 'tidak ada') {
        body.temuan_k3 = 'NULL';
        body.tindak_lanjut = 'NULL';
      }
      delete body.temuan_status;
      // Strip empty optional fields
      ['id_vendor','jumlah_pekerjaan','status_cctv','keterangan_cctv','status_apd',
       'hasil_monitoring','temuan_k3','tindak_lanjut','keterangan']
        .forEach(k => { if (!body[k]) delete body[k]; });
      if (body.jumlah_pekerjaan) body.jumlah_pekerjaan = parseInt(body.jumlah_pekerjaan);

      const res = isEdit
        ? await api.updateLaporan(laporan.id, body)
        : await api.createLaporan(body);
      onSuccess(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan laporan.');
    } finally {
      setLoading(false);
    }
  }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Laporan Pengawasan' : 'Tambah Laporan Pengawasan'} width={660}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Informasi Laporan */}
        <div>
          <div style={sectionHeadStyle}>Informasi Laporan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={grid2}>
              <Field label="Tanggal" required>
                <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)}
                  required style={inputStyle} />
              </Field>
              <Field label="UNIT PELAKSANA" required>
                <select value={form.id_up3} onChange={e => { set('id_up3', e.target.value); set('id_ulp', ''); }}
                  required style={inputStyle}>
                  <option value="">-- Pilih Unit Pelaksana --</option>
                  {(master.up3 || []).map(r => <option key={r.id} value={r.id}>{r.nama_up3}</option>)}
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="ULP">
                <select value={form.id_ulp} onChange={e => set('id_ulp', e.target.value)}
                  disabled={!form.id_up3} style={{ ...inputStyle, opacity: form.id_up3 ? 1 : 0.65 }}>
                  <option value="">{form.id_up3 ? '-- Pilih ULP (opsional) --' : '-- Pilih Unit Pelaksana dulu --'}</option>
                  {filteredUlp.map(r => <option key={r.id} value={r.id}>{r.nama_ulp}</option>)}
                </select>
              </Field>
              <Field label="Regu" required>
                <select value={form.id_regu} onChange={e => set('id_regu', e.target.value)}
                  required style={inputStyle}>
                  <option value="">-- Pilih Regu --</option>
                  {(master.regu || []).map(r => <option key={r.id} value={r.id}>{r.nama_regu}</option>)}
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="Lokasi" required>
                <input type="text" value={form.lokasi} onChange={e => set('lokasi', e.target.value)}
                  required placeholder="Masukkan lokasi pekerjaan" style={inputStyle} />
              </Field>
              <Field label="Vendor">
                <select value={form.id_vendor} onChange={e => set('id_vendor', e.target.value)} style={inputStyle}>
                  <option value="">-- Pilih Vendor (opsional) --</option>
                  {(master.vendor || []).map(r => <option key={r.id} value={r.id}>{r.nama_vendor}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Pelaksana & Pekerjaan */}
        <div>
          <div style={sectionHeadStyle}>Pelaksana & Pekerjaan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={grid2}>
              <Field label="Nama Pelaksana">
                <input type="text" value={form.nama_pelaksana} onChange={e => set('nama_pelaksana', e.target.value)}
                  placeholder="Nama pelaksana pekerjaan" style={inputStyle} />
              </Field>
              <Field label="Jumlah Pekerjaan">
                <input type="number" min="1" value={form.jumlah_pekerjaan}
                  onChange={e => set('jumlah_pekerjaan', e.target.value)}
                  placeholder="1" style={inputStyle} />
              </Field>
            </div>
            <Field label="Uraian Pekerjaan">
              <textarea value={form.uraian_pekerjaan} onChange={e => set('uraian_pekerjaan', e.target.value)}
                rows={3} placeholder="Deskripsi pekerjaan yang dilakukan..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
          </div>
        </div>

        {/* Status K3 */}
        <div>
          <div style={sectionHeadStyle}>Status K3</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            <Field label="Status CCTV">
              <select value={form.status_cctv} onChange={e => set('status_cctv', e.target.value)} style={inputStyle}>
                <option value="">-- Pilih --</option>
                <option value="ada">Ada</option>
                <option value="tidak ada">Tidak Ada</option>
              </select>
            </Field>
            <Field label="Keterangan CCTV">
              <select value={form.keterangan_cctv} onChange={e => set('keterangan_cctv', e.target.value)} style={inputStyle}>
                <option value="">-- Pilih --</option>
                <option value="aktif">Aktif</option>
                <option value="tidak aktif">Tidak Aktif</option>
                <option value="tidak muncul di Ezviz">Tidak Muncul di Ezviz</option>
              </select>
            </Field>
            <Field label="Status APD">
              <select value={form.status_apd} onChange={e => set('status_apd', e.target.value)} style={inputStyle}>
                <option value="">-- Pilih --</option>
                <option value="lengkap">Lengkap</option>
                <option value="tidak lengkap">Tidak Lengkap</option>
                <option value="tidak termonitor">Tidak Termonitor</option>
              </select>
            </Field>
            <Field label="Hasil Monitoring">
              <select
                value={form.hasil_monitoring}
                onChange={e => set('hasil_monitoring', e.target.value)}
                disabled={lockHasilMonitoring}
                style={{ ...inputStyle, opacity: lockHasilMonitoring ? 0.65 : 1 }}
              >
                <option value="">-- Pilih --</option>
                {HASIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Temuan */}
        <div>
          <div style={sectionHeadStyle}>Temuan & Tindak Lanjut</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Ada Temuan K3?">
              <select
                value={form.temuan_status}
                onChange={e => {
                  const value = e.target.value;
                  setForm(f => ({
                    ...f,
                    temuan_status: value,
                    temuan_k3: value === 'tidak ada' ? '' : f.temuan_k3,
                    tindak_lanjut: value === 'tidak ada' ? '' : f.tindak_lanjut,
                  }));
                }}
                style={inputStyle}
              >
                <option value="">-- Pilih --</option>
                <option value="ada">Ada</option>
                <option value="tidak ada">Tidak Ada</option>
              </select>
            </Field>
            {form.temuan_status === 'ada' && (
              <>
                <Field label="Temuan K3">
                  <textarea value={form.temuan_k3} onChange={e => set('temuan_k3', e.target.value)}
                    rows={2} placeholder="Temuan K3 di lapangan"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
                <Field label="Tindak Lanjut">
                  <textarea value={form.tindak_lanjut} onChange={e => set('tindak_lanjut', e.target.value)}
                    rows={2} placeholder="Tindak lanjut yang dilakukan"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
              </>
            )}
            {form.temuan_status === 'tidak ada' && (
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.22)',
                color: 'var(--muted)',
                fontSize: 12,
                lineHeight: 1.5,
              }}>
                Tidak ada Temuan K3 dan Tindak Lanjut
              </div>
            )}
            <Field label="Keterangan">
              <textarea value={form.keterangan} onChange={e => set('keterangan', e.target.value)}
                rows={2} placeholder="Keterangan tambahan (opsional)"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Batal
          </button>
          <button type="submit" disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: loading ? 'var(--dim)' : 'var(--accent)',
            border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Laporan')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Badge configs for Status K3 ──────────────────────────────────
const STATUS_CCTV_CFG = {
  'ada':       { label: 'Ada',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'tidak ada': { label: 'Tidak Ada', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};
const KETERANGAN_CCTV_CFG = {
  'aktif':                 { label: 'Aktif',                 color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'tidak aktif':           { label: 'Tidak Aktif',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  'tidak muncul di ezviz': { label: 'Tidak Muncul di Ezviz', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};
const STATUS_APD_CFG = {
  'lengkap':       { label: 'Lengkap',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'tidak lengkap': { label: 'Tidak Lengkap', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4', bg: 'rgba(136,153,180,0.12)' },
};
const HASIL_DETAIL_CFG = {
  'aman':             { label: 'Aman',             color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  'tidak aman':       { label: 'Tidak Aman',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4', bg: 'rgba(136,153,180,0.12)' },
};
const STATUS_SWA_CFG = {
  'diberhentikan':              { label: 'Diberhentikan', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'berjalan setelah perbaikan': { label: 'Berjalan Setelah Perbaikan', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

// ── ModalDetailLaporan ───────────────────────────────────────────
function ModalDetailLaporan({ open, onClose, laporan }) {
  if (!laporan) return null;

  // Text row
  const Row = ({ label, value, mono }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      <span style={{
        fontSize: 13, color: value ? 'var(--text)' : 'var(--dim)',
        fontFamily: 'inherit',
        lineHeight: 1.5,
      }}>
        {value || '—'}
      </span>
    </div>
  );

  // Badge row (for K3 status fields)
  const BadgeRow = ({ label, value, cfg }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      {value
        ? <Badge value={value} cfg={cfg} />
        : <span style={{ fontSize: 13, color: 'var(--dim)' }}>—</span>
      }
    </div>
  );

  // Card wrapper for each section
  const Card = ({ title, children }) => (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--dim)',
        textTransform: 'uppercase', letterSpacing: '0.7px',
        marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };
  const grid4 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 };

  return (
    <Modal open={open} onClose={onClose} title={`Detail Laporan`} width={700}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Header: ID + badges ─── */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          padding: '14px 16px', borderRadius: 10,
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
              ID Laporan
            </div>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--accent)',
            }}>
              {laporan.id}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge value={laporan.status_pekerjaan} cfg={STATUS_PEKERJAAN_CFG} />
            {laporan.hasil_monitoring && <Badge value={laporan.hasil_monitoring} cfg={HASIL_CFG} />}
          </div>
        </div>

        {/* ── Informasi Dasar ─── */}
        <Card title="Informasi Laporan">
          <div style={grid3}>
            <Row label="Tanggal"     value={fmtDate(laporan.tanggal)} />
            <Row label="No Urut"     value={laporan.no_urut ? `#${laporan.no_urut}` : '—'} mono />
            <Row label="Dibuat Oleh" value={laporan.nama_created_by} />
          </div>
        </Card>

        {/* ── Lokasi & Organisasi ─── */}
        <Card title="Lokasi & Organisasi">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={grid2}>
              <Row label="UP3"   value={laporan.nama_up3} />
              <Row label="ULP"   value={laporan.nama_ulp} />
            </div>
            <div style={grid2}>
              <Row label="Regu"   value={laporan.nama_regu} />
              <Row label="Lokasi" value={laporan.nama_lokasi} />
            </div>
            {laporan.nama_vendor && (
              <Row label="Vendor" value={laporan.nama_vendor} />
            )}
          </div>
        </Card>

        {/* ── Pelaksana & Pekerjaan ─── */}
        <Card title="Pelaksana & Pekerjaan">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={grid2}>
              <Row label="Nama Pelaksana"   value={laporan.nama_pelaksana} />
              <Row label="Jumlah Pekerjaan" value={laporan.jumlah_pekerjaan} />
            </div>
            <Row label="Uraian Pekerjaan" value={laporan.uraian_pekerjaan} />
          </div>
        </Card>

        {/* ── Status K3 ─── */}
        <Card title="Status K3">
          <div style={grid4}>
            <BadgeRow label="Status CCTV"     value={laporan.status_cctv}      cfg={STATUS_CCTV_CFG}   />
            <BadgeRow label="Keterangan CCTV" value={laporan.keterangan_cctv}  cfg={KETERANGAN_CCTV_CFG} />
            <BadgeRow label="Status APD"      value={laporan.status_apd}       cfg={STATUS_APD_CFG}    />
            <BadgeRow label="Hasil Monitoring" value={laporan.hasil_monitoring} cfg={HASIL_DETAIL_CFG}  />
          </div>
        </Card>

        {/* ── Timeline (kondisional) ─── */}
        {(laporan.tanggal_pekerjaan_berjalan || laporan.tanggal_pekerjaan_selesai) && (
          <Card title="Timeline">
            <div style={grid2}>
              <Row label="Mulai Berjalan" value={fmtDateTime(laporan.tanggal_pekerjaan_berjalan)} />
              <Row label="Selesai"        value={fmtDateTime(laporan.tanggal_pekerjaan_selesai)} />
            </div>
          </Card>
        )}

        {/* ── Temuan & Tindak Lanjut (kondisional) ─── */}
        {(laporan.temuan_k3 || laporan.tindak_lanjut || laporan.keterangan) && (
          <Card title="Temuan & Tindak Lanjut">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {laporan.temuan_k3     && <Row label="Temuan K3"     value={laporan.temuan_k3}     />}
              {laporan.tindak_lanjut && <Row label="Tindak Lanjut" value={laporan.tindak_lanjut} />}
              {laporan.keterangan    && <Row label="Keterangan"    value={laporan.keterangan}    />}
            </div>
          </Card>
        )}

        {Number(laporan.has_swa) === 1 && (
          <Card title="SWA">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={grid3}>
                <Row label="ID SWA" value={laporan.swa_id} />
                <Row label="Tanggal SWA" value={fmtDateTime(laporan.swa_tanggal)} />
                <BadgeRow label="Status SWA" value={laporan.status_swa} cfg={STATUS_SWA_CFG} />
              </div>
              <Row label="Catatan / Temuan" value={laporan.swa_catatan} />
              <Row label="Tindakan" value={laporan.swa_tindakan} />
              {laporan.swa_keterangan && <Row label="Keterangan SWA" value={laporan.swa_keterangan} />}
            </div>
          </Card>
        )}

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

// ── ModalUpdateStatus ────────────────────────────────────────────
const STATUS_FLOW = [
  { value: 'pending',  label: 'Pending',  color: '#f59e0b', desc: 'Menunggu pelaksanaan' },
  { value: 'berjalan', label: 'Berjalan', color: '#3b82f6', desc: 'Pekerjaan sedang berlangsung' },
  { value: 'selesai',  label: 'Selesai',  color: '#10b981', desc: 'Pekerjaan telah selesai' },
];

function ModalUpdateStatus({ open, onClose, laporan, onSuccess }) {
  const [selected, setSelected] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (open && laporan) { setSelected(laporan.status_pekerjaan || 'pending'); setError(''); }
  }, [open, laporan]);

  if (!laporan) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (selected === laporan.status_pekerjaan) { onClose(); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.updateLaporanStatus(laporan.id, { status_pekerjaan: selected });
      onSuccess(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui status.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Update Status Pekerjaan" width={460}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Laporan info */}
        <div style={{
          padding: '10px 14px', borderRadius: 9,
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
            {laporan.id}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
            {laporan.uraian_pekerjaan?.slice(0, 60)}{laporan.uraian_pekerjaan?.length > 60 ? '…' : ''}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Status selector */}
        <div>
          <label style={labelStyle}>Pilih Status Baru</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_FLOW.map(s => {
              const isCurrent  = s.value === laporan.status_pekerjaan;
              const isSelected = s.value === selected;
              return (
                <label key={s.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                  border: isSelected ? `2px solid ${s.color}` : '1px solid var(--border)',
                  background: isSelected ? `${s.color}12` : 'var(--bg)',
                  transition: 'border 0.15s, background 0.15s',
                }}>
                  <input
                    type="radio" name="status" value={s.value}
                    checked={isSelected}
                    onChange={() => setSelected(s.value)}
                    style={{ accentColor: s.color, width: 15, height: 15 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? s.color : 'var(--text)' }}>
                      {s.label}
                      {isCurrent && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          color: s.color, background: `${s.color}18`,
                          border: `1px solid ${s.color}44`,
                          borderRadius: 4, padding: '1px 6px',
                          textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>
                          Saat ini
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Batal
          </button>
          <button type="submit" disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: loading ? 'var(--dim)' : '#3b82f6',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            {loading ? 'Menyimpan...' : 'Simpan Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── ModalInputSWA ─────────────────────────────────────────────────
function ModalInputSWA({ open, onClose, laporan, onSuccess }) {
  const BLANK_SWA = { catatan: '', tindakan: '', status_swa: '', keterangan: '' };
  const [form,    setForm]    = useState(BLANK_SWA);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { if (open) { setForm(BLANK_SWA); setError(''); } }, [open]);

  if (!laporan) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = {
        id_laporan_pengawasan: laporan.id,
        catatan:    form.catatan,
        tindakan:   form.tindakan,
        status_swa: form.status_swa,
      };
      if (form.keterangan) body.keterangan = form.keterangan;

      const res = await api.createSWA(body);
      onSuccess(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal membuat SWA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Input Stop Work Authority (SWA)" width={560}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Laporan referensi */}
        <div style={{
          padding: '12px 16px', borderRadius: 9,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hasil Monitoring: Tidak Aman
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
            {laporan.id}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {laporan.uraian_pekerjaan?.slice(0, 70)}{laporan.uraian_pekerjaan?.length > 70 ? '…' : ''}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <Field label="Catatan / Temuan" required>
          <textarea value={form.catatan} onChange={e => set('catatan', e.target.value)}
            required rows={3}
            placeholder="Deskripsikan kondisi tidak aman yang ditemukan..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>

        <Field label="Tindakan yang Diambil" required>
          <textarea value={form.tindakan} onChange={e => set('tindakan', e.target.value)}
            required rows={3}
            placeholder="Tindakan SWA yang diambil untuk menghentikan pekerjaan..."
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
          <textarea value={form.keterangan} onChange={e => set('keterangan', e.target.value)}
            rows={2} placeholder="Keterangan tambahan (opsional)"
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Batal
          </button>
          <button type="submit" disabled={loading} style={{
            padding: '9px 20px', borderRadius: 8,
            background: loading ? 'var(--dim)' : '#ef4444',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            {loading ? 'Menyimpan...' : 'Buat SWA'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────
const FILTER_BLANK = {
  tanggal_dari: '', tanggal_sampai: '',
  id_up3: '', id_ulp: '',
  status_pekerjaan: '', hasil_monitoring: '',
};
const PAGE_LIMIT = 15;

export default function LaporanPage() {
  // Master data
  const [master, setMaster] = useState({ up3: [], ulp: [], regu: [], vendor: [] });

  // Table data
  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);

  // Filters: draft (live form) vs applied (triggers fetch)
  const [draftFilter,   setDraftFilter]   = useState(FILTER_BLANK);
  const [appliedFilter, setAppliedFilter] = useState(FILTER_BLANK);
  const [currentPage,   setCurrentPage]   = useState(1);

  // Modals
  const [modalAdd,    setModalAdd]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [detailRow,   setDetailRow]   = useState(null);
  const [statusRow,   setStatusRow]   = useState(null);
  const [swaRow,      setSwaRow]      = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  // Load master data once
  useEffect(() => {
    Promise.allSettled([
      api.getUP3(), api.getULP(), api.getRegu(), api.getVendor(),
    ]).then(([up3Res, ulpRes, reguRes, vendorRes]) => {
      setMaster({
        up3:    up3Res.status    === 'fulfilled' ? (up3Res.value.data    || []) : [],
        ulp:    ulpRes.status    === 'fulfilled' ? (ulpRes.value.data    || []) : [],
        regu:   reguRes.status   === 'fulfilled' ? (reguRes.value.data   || []) : [],
        vendor: vendorRes.status === 'fulfilled' ? (vendorRes.value.data || []) : [],
      });
    });
  }, []);

  // Fetch laporan when applied filter or page changes
  const fetchLaporan = useCallback(async (filter, page) => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filter.tanggal_dari)    params.tanggal_dari    = filter.tanggal_dari;
      if (filter.tanggal_sampai)  params.tanggal_sampai  = filter.tanggal_sampai;
      if (filter.id_up3)          params.id_up3          = filter.id_up3;
      if (filter.id_ulp)          params.id_ulp          = filter.id_ulp;
      if (filter.status_pekerjaan)params.status_pekerjaan= filter.status_pekerjaan;
      if (filter.hasil_monitoring)params.hasil_monitoring= filter.hasil_monitoring;

      const res = await api.getLaporan(params);
      setRows(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaporan(appliedFilter, currentPage);
  }, [appliedFilter, currentPage, fetchLaporan]);

  function applyFilter() {
    setCurrentPage(1);
    setAppliedFilter({ ...draftFilter });
  }

  function resetFilter() {
    setDraftFilter(FILTER_BLANK);
    setCurrentPage(1);
    setAppliedFilter(FILTER_BLANK);
  }

  function handleAddSuccess(newRow, message) {
    showToast(message || 'Laporan berhasil ditambahkan.');
    fetchLaporan(appliedFilter, currentPage);
  }

  function handleStatusSuccess(updatedRow, message) {
    showToast(message || 'Status berhasil diperbarui.');
    setRows(prev => prev.map(r => r.id === updatedRow.id ? { ...r, ...updatedRow } : r));
  }

  function handleEditSuccess(updatedRow, message) {
    showToast(message || 'Laporan berhasil diperbarui.');
    setRows(prev => prev.map(r => r.id === updatedRow.id ? { ...r, ...updatedRow } : r));
  }

  function handleSWASuccess(swaData, message) {
    showToast(message || 'SWA berhasil dibuat.');
    setRows(prev => prev.map(r => (
      r.id === swaData.id_laporan_pengawasan ? { ...r, has_swa: 1 } : r
    )));
  }

  const setDraft = (k, v) => setDraftFilter(f => ({ ...f, [k]: v }));

  const hasFilter = Object.values(appliedFilter).some(v => v !== '');
  const filteredFilterUlp = master.ulp.filter(r => draftFilter.id_up3 && sameId(r.id_up3, draftFilter.id_up3));
  // ── Icon helpers ─────────────────────────────────────────────
  const IconDetail = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const actionButtonStyle = (color, disabled = false) => ({
    width: 34,
    height: 34,
    padding: 0,
    borderRadius: 9,
    background: disabled ? 'transparent' : `${color}1A`,
    border: disabled ? '1px solid var(--border)' : `1px solid ${color}4D`,
    color: disabled ? 'var(--dim)' : color,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

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
          animation: 'fade-in 0.2s ease',
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
          background: 'linear-gradient(90deg, rgba(16,185,129,0.08), transparent 48%, rgba(239,68,68,0.06))',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <polyline points="9 14 11 16 15 12" />
                </svg>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                Laporan Pengawasan
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '5px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              Kelola laporan K3 lapangan, update status pekerjaan, dan tindak lanjuti temuan tidak aman.
            </p>
          </div>
          <button
            onClick={() => setModalAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', borderRadius: 9,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
              boxShadow: '0 10px 24px rgba(34,211,238,0.18)',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Laporan
          </button>
        </div>
      </section>

      {/* ── Filter bar ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '17px 20px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          {/* Tanggal Dari */}
          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>Tanggal Dari</label>
            <input type="date" value={draftFilter.tanggal_dari}
              onChange={e => setDraft('tanggal_dari', e.target.value)}
              style={{ ...inputStyle, width: 140 }} />
          </div>

          {/* Tanggal Sampai */}
          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>Tanggal Sampai</label>
            <input type="date" value={draftFilter.tanggal_sampai}
              onChange={e => setDraft('tanggal_sampai', e.target.value)}
              style={{ ...inputStyle, width: 140 }} />
          </div>

          {/* Unit Pelaksana */}
          <div style={{ minWidth: 160 }}>
            <label style={labelStyle}>UNIT PELAKSANA</label>
            <select value={draftFilter.id_up3} onChange={e => setDraftFilter(f => ({ ...f, id_up3: e.target.value, id_ulp: '' }))}
              style={{ ...inputStyle, width: 160 }}>
              <option value="">Semua Unit</option>
              {master.up3.map(r => <option key={r.id} value={r.id}>{r.nama_up3}</option>)}
            </select>
          </div>

          {/* ULP */}
          <div style={{ minWidth: 160 }}>
            <label style={labelStyle}>ULP</label>
            <select value={draftFilter.id_ulp} onChange={e => setDraft('id_ulp', e.target.value)}
              disabled={!draftFilter.id_up3}
              style={{ ...inputStyle, width: 160, opacity: draftFilter.id_up3 ? 1 : 0.65 }}>
              <option value="">{draftFilter.id_up3 ? 'Semua ULP' : 'Pilih Unit dulu'}</option>
              {filteredFilterUlp.map(r => <option key={r.id} value={r.id}>{r.nama_ulp}</option>)}
            </select>
          </div>

          {/* Status */}
          <div style={{ minWidth: 130 }}>
            <label style={labelStyle}>Status</label>
            <select value={draftFilter.status_pekerjaan}
              onChange={e => setDraft('status_pekerjaan', e.target.value)}
              style={{ ...inputStyle, width: 130 }}>
              <option value="">Semua Status</option>
              {STATUS_PEKERJAAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Hasil Monitoring */}
          <div style={{ minWidth: 160 }}>
            <label style={labelStyle}>Hasil Monitoring</label>
            <select value={draftFilter.hasil_monitoring}
              onChange={e => setDraft('hasil_monitoring', e.target.value)}
              style={{ ...inputStyle, width: 160 }}>
              <option value="">Semua Hasil</option>
              {HASIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginLeft: 'auto' }}>
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
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', fontSize: 13, fontWeight: 800,
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
                {['No', 'ID / Tanggal', 'Lokasi', 'Uraian Pekerjaan', 'Tim', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px',
                    fontSize: 10, fontWeight: 700,
                    color: '#a8b7d0',
                    textAlign: ['Status', 'Aksi'].includes(h) ? 'left' : 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
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
                    {[40, 120, 120, 200, 150, 80, 80].map((w, j) => (
                      <td key={j} style={{ padding: '15px 16px' }}>
                        <div className="skeleton" style={{ width: w, height: 12, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                      </svg>
                      <span style={{ fontSize: 13, color: 'var(--dim)' }}>
                        {hasFilter ? 'Tidak ada laporan yang cocok dengan filter.' : 'Belum ada laporan pengawasan.'}
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                      {row.id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                      {fmtDate(row.tanggal)}
                    </div>
                  </td>

                  {/* Lokasi */}
                  <td style={{ padding: '14px 16px', minWidth: 180 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{row.lokasi || row.nama_lokasi || 'Lokasi belum diisi'}</div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3 }}>{row.nama_up3 || 'UP3 belum diisi'}</div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 1 }}>{row.nama_ulp || 'ULP belum dipilih'}</div>
                  </td>

                  {/* Uraian */}
                  <td style={{ padding: '14px 16px', maxWidth: 280 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)' }}>{truncate(row.uraian_pekerjaan)}</div>
                    {row.nama_pelaksana && (
                      <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                        {row.nama_pelaksana}
                      </div>
                    )}
                  </td>

                  {/* Tim */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                      {row.nama_regu || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                      {row.nama_vendor || 'Vendor belum dipilih'}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }}>
                      <Badge value={row.status_pekerjaan} cfg={STATUS_PEKERJAAN_CFG} />
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
                        }}>
                          SWA
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                      {/* Detail */}
                      <button
                        onClick={() => setDetailRow(row)}
                        title="Lihat Detail"
                        style={actionButtonStyle('#22d3ee')}
                      >
                        <IconDetail />
                      </button>

                      <button
                        onClick={() => setEditRow(row)}
                        disabled={row.status_pekerjaan === 'selesai'}
                        title={row.status_pekerjaan === 'selesai' ? 'Laporan selesai tidak dapat diedit' : 'Edit Laporan'}
                        style={actionButtonStyle('#f59e0b', row.status_pekerjaan === 'selesai')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                      </button>

                      {/* Update Status */}
                      <button
                        onClick={() => setStatusRow(row)}
                        disabled={row.status_pekerjaan === 'selesai'}
                        title={row.status_pekerjaan === 'selesai' ? 'Status selesai sudah terkunci' : 'Update Status'}
                        style={actionButtonStyle('#3b82f6', row.status_pekerjaan === 'selesai')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </button>

                      {/* Input SWA hanya jika belum pernah dibuat */}
                      <button
                        onClick={() => setSwaRow(row)}
                        disabled={row.hasil_monitoring !== 'tidak aman' || Number(row.has_swa) === 1 || row.status_pekerjaan === 'selesai'}
                        title={
                          row.status_pekerjaan === 'selesai'
                            ? 'Laporan selesai tidak dapat dibuat SWA'
                            : Number(row.has_swa) === 1
                              ? 'SWA sudah dibuat'
                              : row.hasil_monitoring !== 'tidak aman'
                                ? 'SWA hanya untuk hasil monitoring tidak aman'
                                : 'Input SWA'
                        }
                        style={actionButtonStyle('#ef4444', row.hasil_monitoring !== 'tidak aman' || Number(row.has_swa) === 1 || row.status_pekerjaan === 'selesai')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────── */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              Halaman {pagination.page} dari {pagination.totalPages}
              {' '}· {pagination.total} total
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
            {pagination.total} {hasFilter ? 'hasil filter' : 'total laporan'}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <ModalAddLaporan
        open={modalAdd}
        onClose={() => setModalAdd(false)}
        master={master}
        onSuccess={handleAddSuccess}
      />
      <ModalAddLaporan
        open={!!editRow}
        onClose={() => setEditRow(null)}
        master={master}
        laporan={editRow}
        onSuccess={handleEditSuccess}
      />
      <ModalDetailLaporan
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        laporan={detailRow}
      />
      <ModalUpdateStatus
        open={!!statusRow}
        onClose={() => setStatusRow(null)}
        laporan={statusRow}
        onSuccess={handleStatusSuccess}
      />
      <ModalInputSWA
        open={!!swaRow}
        onClose={() => setSwaRow(null)}
        laporan={swaRow}
        onSuccess={handleSWASuccess}
      />
    </div>
  );
}
