/**
 * Donut chart: breakdown hasil_monitoring.
 * Data dari GET /api/dashboard/breakdown → data.by_hasil_monitoring
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const HASIL_CONFIG = [
  { key: 'aman',             label: 'Aman',             color: '#10b981' },
  { key: 'tidak aman',       label: 'Tidak Aman',       color: '#ef4444' },
  { key: 'tidak termonitor', label: 'Tidak Termonitor', color: '#8899b4' },
  { key: 'Belum diisi',      label: 'Belum Diisi',      color: '#5a6a84' },
];

function getColor(label) {
  return HASIL_CONFIG.find(c => c.key.toLowerCase() === (label || '').toLowerCase())?.color || '#5a6a84';
}
function getLabel(key) {
  return HASIL_CONFIG.find(c => c.key.toLowerCase() === (key || '').toLowerCase())?.label || key;
}

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: d.payload.color, marginBottom: 2 }}>
        {d.name}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
          {d.value}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}%</span>
      </div>
    </div>
  );
};

function SkeletonDonut() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div className="skeleton" style={{ width: 160, height: 14, borderRadius: 4, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 60, 70].map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: `${w}%`, height: 11, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 28, height: 14, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HasilMonitoringDonut({ data, loading }) {
  if (loading) return <SkeletonDonut />;

  const rawList = data || [];
  const total   = rawList.reduce((s, r) => s + parseInt(r.total || 0), 0);

  const chartData = rawList
    .map(r => ({
      name:  getLabel(r.label),
      value: parseInt(r.total) || 0,
      color: getColor(r.label),
    }))
    .filter(d => d.value > 0);

  const CenterLabel = ({ cx, cy }) => (
    <>
      <text
        x={cx} y={cy - 5}
        textAnchor="middle"
        fill="var(--text)"
        fontSize={26} fontWeight={700}
      >
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--muted)" fontSize={11}>
        laporan
      </text>
    </>
  );

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
          Hasil Monitoring
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          Distribusi hasil pengawasan
        </div>
        </div>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{
          height: 180, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--dim)' }}>Belum ada data</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Donut */}
          <div style={{ width: 150, height: 150, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={CenterLabel}
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chartData.map(d => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: d.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{pct}%</div>
                  </div>
                  <span style={{
                    fontSize: 16, fontWeight: 700, color: d.color,
                  }}>
                    {d.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
