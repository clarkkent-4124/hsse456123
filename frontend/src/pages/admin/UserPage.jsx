import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';

// ── helpers ────────────────────────────────────────────────────────────────
function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_CFG = {
  admin:  { label: 'Admin',  color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  user:   { label: 'User',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  viewer: { label: 'Viewer', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] || { label: role, color: 'var(--muted)', bg: 'var(--surface2)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      textTransform: 'capitalize',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  const isErr = type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: isErr ? '#ef4444' : '#10b981',
      color: '#fff', borderRadius: 10,
      padding: '10px 18px', fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fadeIn 0.2s ease',
    }}>
      {isErr
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {msg}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 160, 180, 70, 60, 80, 80].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div className="skeleton" style={{ height: 14, width: w, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={checked ? 'Nonaktifkan' : 'Aktifkan'}
      style={{
        width: 36, height: 20, borderRadius: 10,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#10b981' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

// ── Field row helper ───────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text)', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif",
  boxSizing: 'border-box', outline: 'none',
};

// ── Modal Add/Edit User ────────────────────────────────────────────────────
const BLANK_FORM = { username: '', nama: '', email: '', password: '', role: 'user', is_active: true };

function ModalUserForm({ editRow, onClose, onSuccess }) {
  const isEdit = !!editRow;
  const [form, setForm] = useState(
    isEdit
      ? { username: editRow.username, nama: editRow.nama || '', email: editRow.email || '', password: '', role: editRow.role, is_active: !!editRow.is_active }
      : { ...BLANK_FORM }
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); setErr(''); }

  async function submit() {
    if (!form.username.trim()) return setErr('Username wajib diisi.');
    if (!isEdit && !form.password.trim()) return setErr('Password wajib diisi untuk user baru.');
    if (!form.role) return setErr('Role wajib dipilih.');
    setLoading(true);
    try {
      const body = { ...form };
      if (isEdit && !body.password) delete body.password;
      let updated;
      if (isEdit) {
        updated = await api.updateUser(editRow.id, body);
      } else {
        updated = await api.createUser(body);
      }
      onSuccess(updated?.data || updated, isEdit ? 'User berhasil diperbarui.' : 'User berhasil ditambahkan.');
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        border: '1px solid var(--border)',
        width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {isEdit ? 'Edit User' : 'Tambah User Baru'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
              {isEdit ? `Mengedit akun ${editRow.username}` : 'Buat akun pengguna baru'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#ef4444',
            }}>
              {err}
            </div>
          )}

          <Field label="Username" required>
            <input
              style={INPUT_STYLE}
              placeholder="contoh: john_doe"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              disabled={isEdit}
            />
            {isEdit && <span style={{ fontSize: 10, color: 'var(--dim)' }}>Username tidak dapat diubah.</span>}
          </Field>

          <Field label="Nama Lengkap">
            <input
              style={INPUT_STYLE}
              placeholder="Nama lengkap"
              value={form.nama}
              onChange={e => set('nama', e.target.value)}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              style={INPUT_STYLE}
              placeholder="email@perusahaan.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </Field>

          <Field label={isEdit ? 'Password Baru' : 'Password'} required={!isEdit}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...INPUT_STYLE, paddingRight: 36 }}
                placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', padding: 2,
                }}
              >
                {showPw
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </Field>

          <Field label="Role" required>
            <select
              style={{ ...INPUT_STYLE, cursor: 'pointer' }}
              value={form.role}
              onChange={e => set('role', e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </Field>

          <Field label="Status Akun">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
              <span style={{ fontSize: 13, color: form.is_active ? '#10b981' : 'var(--dim)', fontWeight: 500 }}>
                {form.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: '8px 22px', borderRadius: 8,
              border: 'none', background: 'var(--accent)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-9-9"/>
              </svg>
            )}
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Confirm Delete ───────────────────────────────────────────────────
function ModalConfirmDelete({ row, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function confirm() {
    setLoading(true);
    try {
      await api.deleteUser(row.id);
      onSuccess(row.id, `User "${row.nama || row.username}" berhasil dihapus.`);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Gagal menghapus user.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        border: '1px solid var(--border)',
        width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Red strip header */}
        <div style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.25)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Hapus User</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 1 }}>Tindakan ini tidak dapat dibatalkan</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Anda akan menghapus akun{' '}
            <strong style={{ color: 'var(--text)' }}>{row.nama || row.username}</strong>{' '}
            (<code style={{ fontSize: 12, color: 'var(--dim)', background: 'var(--surface2)', padding: '1px 4px', borderRadius: 4 }}>
              {row.username}
            </code>).
            <br />Data yang terhapus tidak dapat dikembalikan.
          </p>
          {err && (
            <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#ef4444' }}>
              {err}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Batal
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: 'none', background: '#ef4444',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-9-9"/>
              </svg>
            )}
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Avatar initial ─────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function UserPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // modal states
  const [addModal, setAddModal]       = useState(false);
  const [editRow, setEditRow]         = useState(null);
  const [deleteRow, setDeleteRow]     = useState(null);
  const [togglingId, setTogglingId]   = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setRows(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      showToast('Gagal memuat data user.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  // ── filtered rows ────────────────────────────────────────────────────────
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (r.nama || '').toLowerCase().includes(q)
      || r.username.toLowerCase().includes(q)
      || (r.email || '').toLowerCase().includes(q);
    const matchRole   = !roleFilter   || r.role === roleFilter;
    const matchStatus = statusFilter === '' || String(r.is_active) === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // ── toggle active ────────────────────────────────────────────────────────
  async function toggleActive(row) {
    setTogglingId(row.id);
    try {
      const updated = await api.updateUser(row.id, { is_active: !row.is_active });
      const newRow = updated?.data || updated;
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...newRow } : r));
      showToast(`User ${!row.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengubah status.', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  // ── callbacks from modals ────────────────────────────────────────────────
  function handleFormSuccess(newRow, msg) {
    showToast(msg);
    if (editRow) {
      setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, ...newRow } : r));
      setEditRow(null);
    } else {
      setRows(prev => [newRow, ...prev]);
      setAddModal(false);
    }
  }

  function handleDeleteSuccess(id, msg) {
    showToast(msg);
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleteRow(null);
  }

  // ── stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:   rows.length,
    aktif:   rows.filter(r => r.is_active).length,
    admin:   rows.filter(r => r.role === 'admin').length,
  };

  return (
    <div className="fade-in">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, margin: '4px 0 0' }}>Kelola akun pengguna sistem HSSE</p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9,
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah User
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total User', value: stats.total, icon: '👥', color: 'var(--accent)' },
          { label: 'Aktif', value: stats.aktif, icon: '✅', color: '#10b981' },
          { label: 'Admin', value: stats.admin, icon: '🔑', color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '14px 16px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--dim)' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{ ...INPUT_STYLE, paddingLeft: 30, minWidth: 0 }}
            placeholder="Cari nama, username, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Role filter */}
        <select
          style={{ ...INPUT_STYLE, width: 'auto', cursor: 'pointer', flex: '0 0 auto' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="viewer">Viewer</option>
        </select>

        {/* Status filter */}
        <select
          style={{ ...INPUT_STYLE, width: 'auto', cursor: 'pointer', flex: '0 0 auto' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>

        {/* Reset */}
        {(search || roleFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--dim)', fontSize: 12, cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reset
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap' }}>
          {filtered.length} dari {rows.length} user
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['No', 'Pengguna', 'Email', 'Role', 'Status', 'Dibuat', 'Aksi'].map((h, i) => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: i === 0 ? 'center' : 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--dim)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--dim)', fontSize: 13 }}>
                        {search || roleFilter || statusFilter
                          ? 'Tidak ada user yang cocok dengan filter.'
                          : 'Belum ada data user.'}
                      </td>
                    </tr>
                  )
                  : filtered.map((row, idx) => {
                    const initial = (row.nama || row.username || '?')[0].toUpperCase();
                    const bgColor = avatarColor(row.username);
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--dim)', width: 40 }}>
                          {idx + 1}
                        </td>

                        {/* Avatar + nama + username */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: bgColor,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{initial}</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                {row.nama || row.username}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>
                                @{row.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                          {row.email || <span style={{ color: 'var(--border)' }}>—</span>}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <RoleBadge role={row.role} />
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Toggle
                              checked={!!row.is_active}
                              onChange={() => toggleActive(row)}
                              disabled={togglingId === row.id}
                            />
                            <span style={{ fontSize: 11, color: row.is_active ? '#10b981' : 'var(--dim)', fontWeight: 500 }}>
                              {row.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap' }}>
                          {fmt(row.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              title="Edit"
                              onClick={() => setEditRow(row)}
                              style={{
                                padding: '6px 12px', borderRadius: 7,
                                border: '1px solid var(--border)', background: 'transparent',
                                color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
                                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 5,
                                transition: 'border-color 0.15s, color 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                            <button
                              title="Hapus"
                              onClick={() => setDeleteRow(row)}
                              style={{
                                padding: '6px 12px', borderRadius: 7,
                                border: '1px solid var(--border)', background: 'transparent',
                                color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
                                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 5,
                                transition: 'border-color 0.15s, color 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border)',
            fontSize: 11, color: 'var(--dim)', background: 'var(--surface2)',
          }}>
            Menampilkan {filtered.length} pengguna
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {(addModal || editRow) && (
        <ModalUserForm
          editRow={editRow || null}
          onClose={() => { setAddModal(false); setEditRow(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
      {deleteRow && (
        <ModalConfirmDelete
          row={deleteRow}
          onClose={() => setDeleteRow(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
