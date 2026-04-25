import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

function formatDateLabel(isoStr) {
  return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Format tanggal dari DB (bisa offset karena timezone) ke label lokal
function formatAxisLabel(tanggal) {
  const d = new Date(tanggal);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', minWidth: 110 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: p.fill }}>{p.dataKey}</span>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function BarChart24h({ dari, sampai, filterKey, applying, onFetchDone }) {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTrend({ dari, sampai })
      .then(res => {
        const built = (res.data || []).map(row => ({
          time:   formatAxisLabel(row.tanggal),
          PICKUP: parseInt(row.PICKUP) || 0,
          RNR:    parseInt(row.RNR)    || 0,
          TCS:    parseInt(row.TCS)    || 0,
        }));
        setTrendData(built);
      })
      .catch(() => setTrendData([]))
      .finally(() => { setLoading(false); onFetchDone?.(); });
  }, [dari, sampai, filterKey]);

  const dateLabel = dari === sampai
    ? formatDateLabel(dari)
    : `${formatDateLabel(dari)} – ${formatDateLabel(sampai)}`;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 14px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
        Tren Alarm: <span style={{ color: 'var(--accent)' }}>{dateLabel}</span>
      </div>

      {(loading || applying) ? (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, paddingBottom: 4 }}>
            {[60, 80, 45, 100, 70, 55, 90, 40, 75, 85, 50, 65].map((h, i) => (
              <div key={i} className="skeleton" style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
            ))}
          </div>
        </div>
      ) : trendData.length === 0 ? (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--dim)' }}>Tidak ada data pada periode ini</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trendData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--dim)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--dim)', fontSize: 10 }}
              axisLine={false} tickLine={false} allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
            <Bar dataKey="PICKUP" stackId="a" fill="#ef4444" />
            <Bar dataKey="RNR"    stackId="a" fill="#3b82f6" />
            <Bar dataKey="TCS"    stackId="a" fill="#a855f7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 8, justifyContent: 'center' }}>
        {[['Pickup', '#ef4444'], ['RNR', '#3b82f6'], ['TCS', '#a855f7']].map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
