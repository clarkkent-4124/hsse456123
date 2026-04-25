import { useEffect, useState } from 'react';
import { api } from '../services/api';

const CARDS = [
  { key: 'PICKUP', label: 'PICKUP',      colorVar: 'var(--pickup)', bgVar: 'var(--pickup-bg)', borderVar: 'var(--pickup-border)', sub: 'alarm aktif' },
  { key: 'TCS',    label: 'TCS',         colorVar: 'var(--tcs)',    bgVar: 'var(--tcs-bg)',    borderVar: 'var(--tcs-border)',    sub: 'trip coil supervision' },
  { key: 'RNR',    label: 'RNR',         colorVar: 'var(--rnr)',    bgVar: 'var(--rnr-bg)',    borderVar: 'var(--rnr-border)',    sub: 'tidak siap' },
  { key: 'TOTAL',  label: 'TOTAL AKTIF', colorVar: 'var(--accent)', bgVar: 'var(--accent-bg)', borderVar: 'var(--accent-border)', sub: 'alarm aktif saat ini' },
];

export default function SummaryCards({ onCardClick }) {
  const [counts, setCounts] = useState({ PICKUP: '-', TCS: '-', RNR: '-', TOTAL: '-' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary()
      .then(data => {
        setCounts({
          PICKUP: parseInt(data.PICKUP) || 0,
          TCS:    parseInt(data.TCS)    || 0,
          RNR:    parseInt(data.RNR)    || 0,
          TOTAL:  parseInt(data.TOTAL)  || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', letterSpacing: 1, margin: '0 0 10px', textTransform: 'uppercase' }}>
        Ringkasan Alarm Aktif
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {CARDS.map(card => (
          <button
            key={card.key}
            onClick={() => onCardClick(card.key)}
            style={{
              background: card.bgVar,
              border: `1px solid ${card.borderVar}`,
              borderRadius: 14,
              padding: '14px 14px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.1s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Watermark letter */}
            <div style={{
              position: 'absolute', right: -4, top: -4,
              fontSize: 52, fontWeight: 900, color: card.colorVar, opacity: 0.07,
              fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none',
            }}>
              {card.label[0]}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: card.colorVar, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>
              {card.label}
            </div>
            <div className="font-mono" style={{ fontSize: 36, fontWeight: 700, color: card.colorVar, lineHeight: 1, minHeight: 40 }}>
              {loading ? (
                <div style={{ width: 40, height: 32, background: card.bgVar, borderRadius: 6, border: `1px solid ${card.borderVar}`, marginTop: 4 }} />
              ) : counts[card.key]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{card.sub}</div>
            <div style={{ fontSize: 10, color: card.colorVar, marginTop: 8, opacity: 0.7 }}>↗ tap untuk detail</div>
          </button>
        ))}
      </div>
    </div>
  );
}
