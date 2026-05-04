const CARDS = [
  {
    key: 'total_bulan_ini',
    label: 'Total Bulan Ini',
    sub: 'laporan bulan ini',
    color: 'var(--accent)',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    key: 'pending_bulan_ini',
    label: 'Pending',
    sub: 'menunggu pelaksanaan',
    color: 'var(--pending)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    key: 'berjalan_bulan_ini',
    label: 'Berjalan',
    sub: 'pekerjaan berlangsung',
    color: 'var(--berjalan)',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    key: 'selesai_bulan_ini',
    label: 'Selesai',
    sub: 'pekerjaan selesai',
    color: 'var(--selesai)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    key: 'swa_bulan_ini',
    label: 'SWA Bulan Ini',
    sub: 'stop work authority',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

function CardSkeleton({ card }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${card.border}`,
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 82, height: 12, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
      </div>
      <div className="skeleton" style={{ width: 56, height: 34, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 108, height: 10, borderRadius: 4 }} />
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 14,
      }}
    >
      {CARDS.map(card => (
        loading ? (
          <CardSkeleton key={card.key} card={card} />
        ) : (
          <div
            key={card.key}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${card.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${card.bg}, transparent 58%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: card.color,
              }}
            />

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: card.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {card.label}
                </span>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: 'var(--text)',
                  lineHeight: 1,
                  marginBottom: 7,
                }}
              >
                {data?.[card.key] ?? 0}
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {card.sub}
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
}
