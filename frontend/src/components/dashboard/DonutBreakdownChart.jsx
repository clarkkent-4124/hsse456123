import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function SkeletonDonut() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div className="skeleton" style={{ width: 150, height: 14, borderRadius: 4, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="skeleton" style={{ width: 132, height: 132, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 65, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '9px 12px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: item.payload.color }}>{item.name}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.value} laporan · {pct}%</div>
    </div>
  );
};

export default function DonutBreakdownChart({
  title,
  subtitle,
  data,
  loading,
  config,
}) {
  if (loading) return <SkeletonDonut />;

  const normalized = (data || [])
    .map(row => {
      const key = String(row.label || '').toLowerCase();
      const item = config[key] || { label: row.label || 'Belum diisi', color: '#5a6a84' };
      return {
        name: item.label,
        value: parseInt(row.total, 10) || 0,
        color: item.color,
      };
    })
    .filter(row => row.value > 0);

  const total = normalized.reduce((sum, row) => sum + row.value, 0);

  const CenterLabel = ({ cx, cy }) => (
    <>
      <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text)" fontSize={24} fontWeight={800}>
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
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
      </div>

      {normalized.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: 12 }}>
          Belum ada data
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 145, height: 145, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalized}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={CenterLabel}
                  startAngle={90}
                  endAngle={-270}
                >
                  {normalized.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
            {normalized.map(row => {
              const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{row.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{pct}%</div>
                  </div>
                  <span style={{ fontSize: 16, color: row.color, fontWeight: 800 }}>{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
