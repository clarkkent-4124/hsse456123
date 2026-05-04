/**
 * Bar chart: laporan 7 hari terakhir, stacked per status_pekerjaan.
 * Data dari GET /api/dashboard/chart
 */
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const BARS = [
  { key: 'pending',    label: 'Pending',     color: 'var(--pending)'    },
  { key: 'berjalan',   label: 'Berjalan',    color: 'var(--berjalan)'   },
  { key: 'selesai',    label: 'Selesai',     color: 'var(--selesai)'    },
  { key: 'tidak_aman', label: 'Tidak Aman',  color: 'var(--tidak-aman)' },
];

// Mapping CSS var → hex untuk recharts (tidak bisa pakai var() langsung di recharts fill)
const COLOR_HEX = {
  'var(--pending)':    '#f59e0b',
  'var(--berjalan)':   '#3b82f6',
  'var(--selesai)':    '#10b981',
  'var(--tidak-aman)': '#ef4444',
};

function formatTanggal(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short',
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', minWidth: 140,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => p.value > 0 && (
        <div key={p.dataKey} style={{
          display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3,
        }}>
          <span style={{ fontSize: 11, color: p.fill, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
            {BARS.find(b => b.key === p.dataKey)?.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
            {p.value}
          </span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 5, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Total</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{total}</span>
      </div>
    </div>
  );
};

function SkeletonBar() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 20px 16px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
    }}>
      <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
        {[55, 80, 45, 95, 70, 60, 85].map((h, i) => (
          <div key={i} className="skeleton" style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
        {[60, 50, 55, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 10, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}

export default function LaporanBarChart({ data, loading }) {
  if (loading) return <SkeletonBar />;

  const chartData = (data || []).map(row => ({
    tanggal:    formatTanggal(row.tanggal),
    pending:    parseInt(row.pending)    || 0,
    berjalan:   parseInt(row.berjalan)   || 0,
    selesai:    parseInt(row.selesai)    || 0,
    tidak_aman: parseInt(row.tidak_aman) || 0,
  }));

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 20px 14px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
            Tren Pengawasan 7 Hari
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Breakdown laporan per status pekerjaan
          </div>
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          padding: '5px 8px',
          borderRadius: 999,
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          whiteSpace: 'nowrap',
        }}>
          Live summary
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{
          height: 180, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--dim)' }}>Belum ada data laporan</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="tanggal"
              tick={{ fill: 'var(--dim)', fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--dim)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
            <Bar dataKey="pending"    stackId="a" fill="#f59e0b" />
            <Bar dataKey="berjalan"   stackId="a" fill="#3b82f6" />
            <Bar dataKey="selesai"    stackId="a" fill="#10b981" />
            <Bar dataKey="tidak_aman" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {BARS.map(b => (
          <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_HEX[b.color] }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
