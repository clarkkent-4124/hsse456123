import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import SummaryCards from '../../components/dashboard/SummaryCards';
import HorizontalBarChart from '../../components/dashboard/HorizontalBarChart';
import DonutBreakdownChart from '../../components/dashboard/DonutBreakdownChart';
import RecentLaporan from '../../components/dashboard/RecentLaporan';

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: spinning ? 'spin 0.7s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 12,
};

const STATUS_PEKERJAAN_DONUT = {
  berjalan: { label: 'Berjalan', color: '#3b82f6' },
  selesai: { label: 'Selesai', color: '#10b981' },
};

const STATUS_APD_DONUT = {
  lengkap: { label: 'Lengkap', color: '#10b981' },
  'tidak lengkap': { label: 'Tidak Lengkap', color: '#ef4444' },
  'tidak termonitor': { label: 'Tidak Termonitor', color: '#8899b4' },
};

const KETERANGAN_CCTV_DONUT = {
  aktif: { label: 'Aktif', color: '#10b981' },
  'tidak aktif': { label: 'Tidak Aktif', color: '#ef4444' },
  'tidak muncul di ezviz': { label: 'Tidak Terpantau Ezviz', color: '#f59e0b' },
};

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function currentMonthRange() {
  const now = new Date();
  return {
    tanggal_dari: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    tanggal_sampai: formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function periodParams(period) {
  const params = {};
  if (period.tanggal_dari) params.tanggal_dari = period.tanggal_dari;
  if (period.tanggal_sampai) params.tanggal_sampai = period.tanggal_sampai;
  return params;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [recent, setRecent] = useState([]);
  const [draftPeriod, setDraftPeriod] = useState(currentMonthRange);
  const [appliedPeriod, setAppliedPeriod] = useState(currentMonthRange);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAllLaporan = useCallback(async (period) => {
    const limit = 200;
    const params = { ...periodParams(period), limit, page: 1 };
    const first = await api.getLaporan(params);
    const rows = first.data || [];
    const totalPages = first.pagination?.totalPages || 1;

    if (totalPages <= 1) return rows;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, idx) =>
        api.getLaporan({ ...periodParams(period), limit, page: idx + 2 })
      )
    );

    return rows.concat(...rest.map(res => res.data || []));
  }, []);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingSummary(true);
      setLoadingBreakdown(true);
      setLoadingRecent(true);
    }

    try {
      const [sumRes, bkRes, recentRes] = await Promise.allSettled([
        api.getDashboardSummary(periodParams(appliedPeriod)),
        api.getDashboardBreakdown(periodParams(appliedPeriod)),
        fetchAllLaporan(appliedPeriod),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (bkRes.status === 'fulfilled') setBreakdown(bkRes.value.data);
      if (recentRes.status === 'fulfilled') setRecent(recentRes.value || []);

      setLastUpdate(new Date());
    } finally {
      setLoadingSummary(false);
      setLoadingBreakdown(false);
      setLoadingRecent(false);
      setRefreshing(false);
    }
  }, [appliedPeriod, fetchAllLaporan]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const runningCount = summary?.berjalan_hari_ini ?? 0;
  const completedCount = summary?.selesai_hari_ini ?? 0;
  function setPeriod(key, value) {
    setDraftPeriod(prev => ({ ...prev, [key]: value }));
  }

  function applyPeriod() {
    setAppliedPeriod({ ...draftPeriod });
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderRadius: 16,
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 58%, rgba(239,68,68,0.08) 100%)',
          padding: 24,
          boxShadow: '0 18px 50px rgba(0,0,0,0.16)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(34,211,238,0.10), transparent 42%, rgba(16,185,129,0.08))',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 260, flex: '1 1 420px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 0 4px rgba(16,185,129,0.12)',
                }}
              />
              HSSE Control Room
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
              Pelaporan & Pengawasan K3
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0', maxWidth: 560, lineHeight: 1.6 }}>
              Pantau status pekerjaan, temuan tidak aman, dan aktivitas SWA dari satu tampilan operasional.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                }}
              >
                {today}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
              gap: 10,
              flex: '0 1 390px',
              minWidth: 260,
            }}
          >
            {[
              { label: 'Berjalan', value: runningCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
              { label: 'Selesai', value: completedCount, color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
              { label: 'SWA Hari Ini', value: summary?.swa_hari_ini ?? 0, color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: item.bg,
                  border: `1px solid ${item.color}40`,
                }}
              >
                <div style={{ fontSize: 10, color: item.color, fontWeight: 800, textTransform: 'uppercase' }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: item.color,
                    fontWeight: 800,
                    marginTop: 4,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 18,
            paddingTop: 16,
            borderTop: '1px solid rgba(136,153,180,0.16)',
            flexWrap: 'wrap',
          }}
        >
          {lastUpdate && (
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              Update:{' '}
              {lastUpdate.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 15px',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 8,
              color: refreshing ? 'var(--dim)' : 'var(--accent)',
              fontSize: 12,
              fontWeight: 800,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        </div>
      </section>

      <section>
        <div style={{
          width: '100%',
          marginBottom: 12,
        }}>
          <div className="dashboard-date-filter" style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            flexWrap: 'wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
          }}>
            <label className="dashboard-date-field" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 1 260px' }}>
              <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 800, textTransform: 'uppercase' }}>Tanggal Dari</span>
              <input
                type="date"
                value={draftPeriod.tanggal_dari}
                onChange={e => setPeriod('tanggal_dari', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </label>
            <label className="dashboard-date-field" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 1 260px' }}>
              <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 800, textTransform: 'uppercase' }}>Tanggal Sampai</span>
              <input
                type="date"
                value={draftPeriod.tanggal_sampai}
                onChange={e => setPeriod('tanggal_sampai', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </label>
            <button
              className="dashboard-date-apply"
              onClick={applyPeriod}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Terapkan
            </button>
          </div>
        </div>
        <SummaryCards data={summary} loading={loadingSummary} />
      </section>

      <section>
        <div style={sectionLabelStyle}>Analitik Pengawasan</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          <HorizontalBarChart
            title="Laporan per UP3"
            subtitle="Total jumlah laporan berdasarkan UP3"
            data={breakdown?.by_up3}
            loading={loadingBreakdown}
            color="#22d3ee"
          />
          <HorizontalBarChart
            title="Laporan per ULP"
            subtitle="Total jumlah laporan berdasarkan ULP"
            data={breakdown?.by_ulp}
            loading={loadingBreakdown}
            color="#3b82f6"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, marginTop: 16 }}>
          <DonutBreakdownChart
            title="Status Pekerjaan"
            subtitle="Berjalan dan selesai"
            data={breakdown?.by_status_pekerjaan}
            loading={loadingBreakdown}
            config={STATUS_PEKERJAAN_DONUT}
          />
          <DonutBreakdownChart
            title="Status APD"
            subtitle="Lengkap, tidak lengkap, dan tidak termonitor"
            data={breakdown?.by_status_apd}
            loading={loadingBreakdown}
            config={STATUS_APD_DONUT}
          />
          <DonutBreakdownChart
            title="Keterangan CCTV"
            subtitle="Aktif, tidak aktif, dan tidak terpantau Ezviz"
            data={breakdown?.by_keterangan_cctv}
            loading={loadingBreakdown}
            config={KETERANGAN_CCTV_DONUT}
          />
        </div>
      </section>

      <section>
        <div style={sectionLabelStyle}>Semua Laporan</div>
        <RecentLaporan data={recent} loading={loadingRecent} />
      </section>
    </div>
  );
}
