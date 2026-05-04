import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function SkeletonBar() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4, marginBottom: 18 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[88, 72, 60, 45, 35].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}%`, height: 18, borderRadius: 5 }} />
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value || 0;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '9px 12px',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{value} laporan</div>
    </div>
  );
};

export default function HorizontalBarChart({
  title,
  subtitle,
  data,
  loading,
  color = '#22d3ee',
}) {
  if (loading) return <SkeletonBar />;

  const chartData = (data || [])
    .map(row => ({
      label: row.label || 'Belum diisi',
      total: parseInt(row.total, 10) || 0,
    }))
    .filter(row => row.total > 0)
    .slice(0, 8);

  const height = Math.max(220, chartData.length * 34 + 70);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      overflow: 'hidden',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: 12 }}>
          Belum ada data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 12, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
            <Bar dataKey="total" fill={color} radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
