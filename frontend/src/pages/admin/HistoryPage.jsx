export default function AdminHistoryPage() {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          background: 'linear-gradient(90deg, rgba(168,85,247,0.07), transparent 52%, rgba(34,211,238,0.06))',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(168,85,247,0.10)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                History
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '5px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              Riwayat seluruh laporan pengawasan dan aktivitas monitoring K3.
            </p>
          </div>
        </div>
      </section>

      <section style={{
        minHeight: 300,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
          maxWidth: 360,
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: 'rgba(168,85,247,0.10)',
            border: '1px solid rgba(168,85,247,0.25)',
            color: '#a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 5-6" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
            History belum tersedia
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Halaman ini masih placeholder dan siap dilanjutkan menjadi riwayat laporan lengkap.
          </div>
          <span style={{
            fontSize: 11,
            color: '#a855f7',
            background: 'rgba(168,85,247,0.10)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 999,
            padding: '5px 10px',
            fontWeight: 700,
          }}>
            Coming soon
          </span>
        </div>
      </section>
    </div>
  );
}
