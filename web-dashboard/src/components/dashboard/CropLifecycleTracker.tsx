'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CropProgress {
  id: number;
  plot: string;
  crop_name: string;
  days_elapsed: number;
  cycle_days: number;
  progress_pct: number;
  current_stage: string;
  status_color: string;
}

export default function CropLifecycleTracker() {
  const { t } = useTranslation();
  const [crops, setCrops] = useState<CropProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCrops() {
      try {
        const res = await fetch('/api/farm/crops');
        if (res.ok) {
          const data = await res.json();
          setCrops(data);
        }
      } catch (err) {
        console.error('Failed to load crop trackers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCrops();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }}></div>
        <div className="skeleton" style={{ width: '40%', height: 20, margin: '0 auto 8px' }}></div>
        <div className="skeleton" style={{ width: '60%', height: 14, margin: '0 auto' }}></div>
      </div>
    );
  }

  if (crops.length === 0) {
    return (
      <div className="card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)',
        border: '1.5px dashed var(--color-border)', background: 'var(--color-bg-secondary)',
      }}>
        <Sprout size={32} color="var(--color-text-tertiary)" style={{ marginBottom: 12 }} />
        <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          No Active Crops
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Add your first crop to track its lifecycle and receive timely recommendations.
        </p>
        <Link href="/dashboard/farm" className="btn btn-sm btn-primary">
          + Add Crop
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sprout size={20} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Crop Lifecycle Tracker</h3>
        </div>
        <Link href="/dashboard/farm" className="btn btn-sm btn-ghost">
          Manage <ChevronRight size={16} />
        </Link>
      </div>

      <div className="card-body" style={{ paddingTop: 0, paddingBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-md)' }}>
          {crops.map((crop) => (
            <div key={crop.id} style={{
              padding: 'var(--space-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              {/* Header: Title and Plot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {crop.crop_name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    <MapPin size={12} /> {crop.plot}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge" style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                    {crop.current_stage}
                  </div>
                </div>
              </div>

              {/* Progress Detail */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarDays size={14} /> Day {crop.days_elapsed}
                </span>
                <span>{crop.cycle_days} Days Total</span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ 
                width: '100%', 
                height: 8, 
                background: 'var(--color-border)', 
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${crop.progress_pct}%`,
                  background: crop.status_color,
                  borderRadius: 4,
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
