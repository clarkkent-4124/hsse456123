/**
 * Donut chart: breakdown status_apd.
 * Data dari GET /api/dashboard/breakdown → data.by_status_apd
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const APD_CONFIG = [
  { key: 'lengkap',        label: 'Lengkap',        color: '#10b981' },
  { key: 'tidak lengkap',  label: 'Tidak Lengkap',  color: '#ef4444' },
  { key: 'Belum diisi',    label: 'Belum Diisi',    color: '#5a6a84' },
];

function getColor(label) {
  return APD_CONFIG.find(c => c.key.toLowerCase() === (label || '').toLowerCase())?.color || '#5a6a84';
}
function getLabel(key) {
  return APD_CONFIG.find(c => c.key.toLowerCase() === (key || '').toLowerCase())?.label || key;
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
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
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
      borderRadius: 12, padding: '20px',
    }}>
      <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 20 }} />
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

export default function StatusAPDDonut({ data, loading }) {
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
        fontFamily="JetBrains Mono, monospace"
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
      borderRadius: 12, padding: '20px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          Status APD
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          Distribusi kelengkapan APD
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    fontFamily: 'JetBrains Mono, monospace',
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
