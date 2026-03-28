'use client';

import { CloudSun, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WeatherAlertCard() {
  const { t } = useTranslation();

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem' }}>
          <CloudSun size={17} color="var(--color-info)" />
          {t('weatherAlerts', 'Hyper-Local Weather')}
        </h3>
        <span className="badge badge-info">Phase 2</span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-lg)' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--color-border)',
          background: 'var(--color-bg-secondary)',
          width: '100%',
        }}>
          <Lock size={22} color="var(--color-info)" style={{ opacity: 0.5, marginBottom: 10 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {t('comingPhase2Weather', 'Crop-specific weather alerts & 48-hour forecast coming soon.')}
          </span>
        </div>
      </div>

      {/* Watermark */}
      <div style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }}>
        <CloudSun size={150} color="var(--color-info)" />
      </div>
    </div>
  );
}
