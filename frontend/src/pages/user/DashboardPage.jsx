export default function UserDashboardPage() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Panel laporan pengawasan</p>
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
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>User Dashboard</div>
        <div style={{ fontSize: 12, color: 'var(--dim)' }}>Segera hadir</div>
      </div>
    </div>
  );
}
