/**
 * Reusable Badge component for status labels.
 *
 * variant prop maps to CSS variable groups:
 *   status_pekerjaan : 'pending' | 'berjalan' | 'selesai'
 *   hasil_monitoring : 'aman' | 'tidak_aman' | 'tidak_termonitor'
 *   role             : 'admin' | 'user' | 'viewer'
 *   swa              : 'swa'
 */

const VARIANT_MAP = {
  // status_pekerjaan
  pending:           { bg: 'var(--pending-bg)',          border: 'var(--pending-border)',          color: 'var(--pending)',          label: 'Pending' },
  berjalan:          { bg: 'var(--berjalan-bg)',          border: 'var(--berjalan-border)',          color: 'var(--berjalan)',          label: 'Berjalan' },
  selesai:           { bg: 'var(--selesai-bg)',           border: 'var(--selesai-border)',           color: 'var(--selesai)',           label: 'Selesai' },

  // hasil_monitoring
  aman:              { bg: 'var(--selesai-bg)',           border: 'var(--selesai-border)',           color: 'var(--selesai)',           label: 'Aman' },
  tidak_aman:        { bg: 'var(--tidak-aman-bg)',        border: 'var(--tidak-aman-border)',        color: 'var(--tidak-aman)',        label: 'Tidak Aman' },
  tidak_termonitor:  { bg: 'var(--tidak-termonitor-bg)', border: 'var(--tidak-termonitor-border)', color: 'var(--tidak-termonitor)', label: 'Tidak Termonitor' },

  // role
  admin:   { bg: 'var(--swa-bg)',      border: 'var(--swa-border)',      color: 'var(--swa)',      label: 'Admin' },
  user:    { bg: 'var(--berjalan-bg)', border: 'var(--berjalan-border)', color: 'var(--berjalan)', label: 'User' },
  viewer:  { bg: 'var(--accent-bg)',   border: 'var(--accent-border)',   color: 'var(--accent)',   label: 'Viewer' },

  // SWA
  swa:     { bg: 'var(--swa-bg)',      border: 'var(--swa-border)',      color: 'var(--swa)',      label: 'SWA' },

  // Active toggle
  active:  { bg: 'var(--selesai-bg)',    border: 'var(--selesai-border)',    color: 'var(--selesai)',    label: 'Aktif' },
  inactive:{ bg: 'var(--tidak-termonitor-bg)', border: 'var(--tidak-termonitor-border)', color: 'var(--tidak-termonitor)', label: 'Nonaktif' },
};

export default function Badge({ variant, children, style = {} }) {
  const map = VARIANT_MAP[variant] || VARIANT_MAP['viewer'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.2px',
      background: map.bg,
      border: `1px solid ${map.border}`,
      color: map.color,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children ?? map.label}
    </span>
  );
}
