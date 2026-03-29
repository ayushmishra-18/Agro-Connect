'use client';

import { useState, useEffect } from 'react';
import { CloudSun, CloudRain, Wind, Droplets, ThermometerSun, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface WeatherAlert {
  alert: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  related_crops: string;
}

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind: number;
    rain_chance: number;
    irrigation_suggestion: string;
  };
  location: string;
  alerts: WeatherAlert[];
}

export default function WeatherAlertCard() {
  const { t } = useTranslation();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/weather');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Weather load error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || !data) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem' }}>
            <CloudSun size={17} color="var(--color-info)" />
            {t('weatherAlerts', 'Hyper-Local Weather')}
          </h3>
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, fontSize: '0.85rem' }}>Loading weather...</div>
        </div>
      </div>
    );
  }

  // Pick the top alert for the compact card
  const topAlert = data.alerts[0];
  let alertColor = 'var(--color-success)';
  let alertBg = '#EAFBF0';
  if (topAlert?.urgency === 'CRITICAL') { alertColor = 'var(--color-danger)'; alertBg = '#FFEAEA'; }
  else if (topAlert?.urgency === 'HIGH') { alertColor = 'var(--color-warning)'; alertBg = '#FFF4E5'; }

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem' }}>
          <CloudSun size={17} color="var(--color-info)" />
          {t('weatherAlerts', 'Hyper-Local Weather')}
        </h3>
        <Link href="/dashboard/weather" className="btn btn-sm btn-ghost" style={{ fontSize: '0.8rem' }}>
          Details <ChevronRight size={14} />
        </Link>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-lg)' }}>
        {/* Temperature + Irrigation Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <ThermometerSun size={36} color="var(--color-warning)" />
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {Math.round(data.current.temp)}°C
            </span>
          </div>
          <div style={{
            background: data.current.irrigation_suggestion.includes('Skip') ? 'var(--color-danger)' : 'var(--color-success)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 16,
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Droplets size={12} />
            {data.current.irrigation_suggestion}
          </div>
        </div>

        {/* Compact Metrics */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', paddingTop: 'var(--space-xs)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CloudRain size={16} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Rain</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{data.current.rain_chance}%</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wind size={16} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Wind</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{Math.round(data.current.wind)} km/h</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Droplets size={16} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Humidity</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{Math.round(data.current.humidity)}%</div>
            </div>
          </div>
        </div>

        {/* Top Alert Banner */}
        {topAlert && (
          <div style={{
            background: alertBg,
            borderLeft: "3px solid " + alertColor,
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: '0 6px 6px 0',
            display: 'flex',
            gap: 'var(--space-xs)',
            alignItems: 'flex-start'
          }}>
            {topAlert.urgency === 'MEDIUM' ? <Info size={14} color={alertColor} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertTriangle size={14} color={alertColor} style={{ flexShrink: 0, marginTop: 2 }} />}
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {topAlert.alert}
            </span>
          </div>
        )}
      </div>

      {/* Watermark */}
      <div style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.03, pointerEvents: 'none' }}>
        <CloudSun size={150} color="var(--color-info)" />
      </div>
    </div>
  );
}
