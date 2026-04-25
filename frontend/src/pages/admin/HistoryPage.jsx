export default function AdminHistoryPage() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>History</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Riwayat seluruh laporan pengawasan</p>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 320, gap: 12,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>History</div>
        <div style={{ fontSize: 12, color: 'var(--dim)' }}>Coming Soon</div>
      </div>
    </div>
  );
}
