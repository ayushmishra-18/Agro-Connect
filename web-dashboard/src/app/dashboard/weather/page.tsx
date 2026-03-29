'use client';

import { useState, useEffect } from 'react';
import {
  ThermometerSun, CloudRain, Wind, Droplets, AlertTriangle, Info,
  Thermometer, CloudSun, Leaf
} from 'lucide-react';

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
    soil_moisture?: number;
    temp_min?: number;
    precip_24h?: number;
  };
  location: string;
  alerts: WeatherAlert[];
  hourly?: {
    time: string[];
    temperature: number[];
    humidity: number[];
    precipitation: number[];
  };
}

export default function WeatherPage() {
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
        console.error('Weather page load error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, fontSize: '1rem' }}>Loading weather intelligence...</div>
      </div>
    );
  }

  const formatHour = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.getHours().toString().padStart(2, '0') + ':00';
    } catch { return '--'; }
  };

  return (
    <div>
      {/* Hero: Current Weather */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-xs)' }}>
              {data.location}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <ThermometerSun size={56} color="var(--color-warning)" />
              <span style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {Math.round(data.current.temp)}°C
              </span>
            </div>
            {data.current.temp_min !== undefined && (
              <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Tonight's Low: <strong>{data.current.temp_min}°C</strong>
              </div>
            )}
          </div>

          {/* Irrigation Badge */}
          <div style={{
            background: data.current.irrigation_suggestion.includes('Skip') ? 'var(--color-danger)' : 'var(--color-success)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 24,
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Droplets size={18} />
            {data.current.irrigation_suggestion}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {[
          { icon: <CloudRain size={24} color="var(--color-primary)" />, label: 'Rain Chance', value: data.current.rain_chance + '%' },
          { icon: <Wind size={24} color="var(--color-primary)" />, label: 'Wind Speed', value: Math.round(data.current.wind) + ' km/h' },
          { icon: <Droplets size={24} color="var(--color-primary)" />, label: 'Humidity', value: Math.round(data.current.humidity) + '%' },
          { icon: <Leaf size={24} color="var(--color-success)" />, label: 'Soil Moisture', value: (data.current.soil_moisture || '--') + '%' },
          { icon: <Thermometer size={24} color="var(--color-warning)" />, label: "Tonight's Low", value: (data.current.temp_min || '--') + '°C' },
          { icon: <CloudRain size={24} color="var(--color-info)" />, label: '24h Precipitation', value: (data.current.precip_24h || 0) + ' mm' },
        ].map((m, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)' }}>
            <div style={{ padding: 10, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              {m.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Forecast Table */}
      {data.hourly && data.hourly.time.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <CloudSun size={20} color="var(--color-info)" />
              24-Hour Forecast
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Time</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Temp (°C)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Humidity (%)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Rain (mm)</th>
                </tr>
              </thead>
              <tbody>
                {data.hourly.time.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{formatHour(t)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: data.hourly!.temperature[i] > 35 ? 'var(--color-danger)' : 'var(--color-text-primary)', fontWeight: 700 }}>
                      {Math.round(data.hourly!.temperature[i])}°
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: data.hourly!.humidity[i] > 80 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                      {Math.round(data.hourly!.humidity[i])}%
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: data.hourly!.precipitation[i] > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: data.hourly!.precipitation[i] > 0 ? 700 : 400 }}>
                      {data.hourly!.precipitation[i] > 0 ? data.hourly!.precipitation[i].toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Crop Warnings */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            Crop-Specific Warnings
          </h2>
        </div>
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {data.alerts.map((alert, idx) => {
            let alertColor = 'var(--color-success)';
            let bgColor = '#EAFBF0';
            let Icon = Info;
            if (alert.urgency === 'CRITICAL') { alertColor = 'var(--color-danger)'; bgColor = '#FFEAEA'; Icon = AlertTriangle; }
            else if (alert.urgency === 'HIGH') { alertColor = 'var(--color-warning)'; bgColor = '#FFF4E5'; Icon = AlertTriangle; }

            return (
              <div key={idx} style={{
                background: bgColor,
                borderLeft: "4px solid " + alertColor,
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: '0 8px 8px 0',
                display: 'flex',
                gap: 'var(--space-md)',
                alignItems: 'flex-start'
              }}>
                <Icon size={20} color={alertColor} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {alert.alert}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: alertColor, marginTop: 4, fontWeight: 700 }}>
                    TARGET: {alert.related_crops?.toUpperCase() || 'ALL CROPS'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
