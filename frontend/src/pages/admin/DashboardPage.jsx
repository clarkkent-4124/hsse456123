import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import SummaryCards from '../../components/dashboard/SummaryCards';
import LaporanBarChart from '../../components/dashboard/LaporanBarChart';
import HasilMonitoringDonut from '../../components/dashboard/HasilMonitoringDonut';
import StatusAPDDonut from '../../components/dashboard/StatusAPDDonut';
import RecentLaporan from '../../components/dashboard/RecentLaporan';

// ── Refresh icon ────────────────────────────────────────────────
function RefreshIcon({ spinning }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: spinning ? 'spin 0.7s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [summary,   setSummary]   = useState(null);
  const [chart,     setChart]     = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [recent,    setRecent]    = useState([]);

  const [loadingSummary,   setLoadingSummary]   = useState(true);
  const [loadingChart,     setLoadingChart]     = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingRecent,    setLoadingRecent]    = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [lastUpdate,       setLastUpdate]       = useState(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingSummary(true);
      setLoadingChart(true);
      setLoadingBreakdown(true);
      setLoadingRecent(true);
    }

    try {
      const [sumRes, chartRes, bkRes, recentRes] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getDashboardChart(),
        api.getDashboardBreakdown(),
        api.getLaporan({ limit: 5, page: 1 }),
      ]);

      if (sumRes.status === 'fulfilled')    setSummary(sumRes.value.data);
      if (chartRes.status === 'fulfilled')  setChart(chartRes.value.data || []);
      if (bkRes.status === 'fulfilled')     setBreakdown(bkRes.value.data);
      if (recentRes.status === 'fulfilled') setRecent(recentRes.value.data || []);

      setLastUpdate(new Date());
    } finally {
      setLoadingSummary(false);
      setLoadingChart(false);
      setLoadingBreakdown(false);
      setLoadingRecent(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {today}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdate && (
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              Update:{' '}
              {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: refreshing ? 'var(--dim)' : 'var(--muted)',
              fontSize: 12, fontWeight: 500,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = refreshing ? 'var(--dim)' : 'var(--muted)'; }}
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────── */}
      <section>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 12,
        }}>
          Ringkasan Hari Ini
        </div>
        <SummaryCards data={summary} loading={loadingSummary} />
      </section>

      {/* ── Charts row: Bar kiri, dua Donut kanan ───────────── */}
      <section>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 12,
        }}>
          Analitik
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 14,
        }}>
          <LaporanBarChart data={chart} loading={loadingChart} />

          {/* Right column: dua donut stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <HasilMonitoringDonut
              data={breakdown?.by_hasil_monitoring}
              loading={loadingBreakdown}
            />
            <StatusAPDDonut
              data={breakdown?.by_status_apd}
              loading={loadingBreakdown}
            />
          </div>
        </div>
      </section>

      {/* ── Recent laporan table ─────────────────────────────── */}
      <section>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 12,
        }}>
          Aktivitas Terbaru
        </div>
        <RecentLaporan data={recent} loading={loadingRecent} />
      </section>

    </div>
  );
}
