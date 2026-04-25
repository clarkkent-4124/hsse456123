/**
 * 6 summary cards untuk Admin Dashboard.
 * Data dari GET /api/dashboard/summary
 */

const CARDS = [
  {
    key:    'total_hari_ini',
    label:  'Total Hari Ini',
    sub:    'laporan masuk hari ini',
    color:  'var(--accent)',
    bg:     'var(--accent-bg)',
    border: 'var(--accent-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    key:    'pending',
    label:  'Pending',
    sub:    'menunggu pelaksanaan',
    color:  'var(--pending)',
    bg:     'var(--pending-bg)',
    border: 'var(--pending-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
  {
    key:    'berjalan',
    label:  'Berjalan',
    sub:    'pekerjaan sedang berlangsung',
    color:  'var(--berjalan)',
    bg:     'var(--berjalan-bg)',
    border: 'var(--berjalan-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  },
  {
    key:    'selesai',
    label:  'Selesai',
    sub:    'pekerjaan telah selesai',
    color:  'var(--selesai)',
    bg:     'var(--selesai-bg)',
    border: 'var(--selesai-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    key:    'tidak_aman',
    label:  'Tidak Aman',
    sub:    'hasil monitoring tidak aman',
    color:  'var(--tidak-aman)',
    bg:     'var(--tidak-aman-bg)',
    border: 'var(--tidak-aman-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    key:    'swa_aktif',
    label:  'SWA Hari Ini',
    sub:    'stop work authority',
    color:  'var(--swa)',
    bg:     'var(--swa-bg)',
    border: 'var(--swa-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
];

function CardSkeleton({ card }) {
  return (
    <div style={{
      background: card.bg,
      border: `1px solid ${card.border}`,
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 60, height: 11, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ width: 52, height: 32, borderRadius: 6, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: 80, height: 10, borderRadius: 4 }} />
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
    }}>
      {CARDS.map(card => (
        loading ? (
          <CardSkeleton key={card.key} card={card} />
        ) : (
          <div
            key={card.key}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: 12,
              padding: '16px 18px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Watermark */}
            <div style={{
              position: 'absolute', right: -6, bottom: -8,
              fontSize: 64, fontWeight: 900, color: card.color,
              opacity: 0.06, lineHeight: 1,
              fontFamily: 'JetBrains Mono, monospace',
              userSelect: 'none', pointerEvents: 'none',
            }}>
              {card.label[0]}
            </div>

            {/* Header: label + icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: card.color,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {card.label}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: card.bg,
                border: `1px solid ${card.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
            </div>

            {/* Number */}
            <div style={{
              fontSize: 34, fontWeight: 700, color: card.color,
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1, marginBottom: 4,
            }}>
              {data?.[card.key] ?? 0}
            </div>

            {/* Sub label */}
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {card.sub}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
